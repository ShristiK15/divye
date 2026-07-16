import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  prisma,
  Prisma,
} from '@divye/database';
import {parseDecimal} from '@divye/shared/utils/decimal';
import { calculateGstBreakdown} from '@divye/shared';
import Decimal from 'decimal.js';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { buildPaginationMeta } from '../../utils/response';
import { toDecimal } from '../../utils/decimal';
import { cartService } from '../cart/cart.service';
import { notificationService } from '../notifications/notification.service';
import { settingsService } from '../settings/settings.service';
import { logger } from '../../utils/logger';
import type {
  AdminOrdersQuery,
  PlaceOrderDto,
  UpdateOrderStatusDto,
  UserOrdersQuery,
} from './orders.types';

// Allowed forward transitions per the full OrderStatus enum in schema.prisma.
// RETURN_REQUESTED -> DELIVERED covers a rejected return request.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

// Statuses an admin can move an order to regardless of payment state.
const PAYMENT_GUARD_EXEMPT_STATUSES = new Set<string>([
  OrderStatus.CANCELLED,
  OrderStatus.RETURN_REQUESTED,
]);

const orderInclude = {
  items: true,
  address: true,
  payment: true,
  carrier: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
  user: { select: { id: true, email: true, name: true, phone: true } },
};

// Atomic order-number generation via the OrderSequence table, called inside
// the same transaction as order creation. Requires:
//   model OrderSequence { year Int @id; value Int @default(0) }
async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await tx.orderSequence.upsert({
    where: { year },
    create: { year, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `DE-${year}-${seq.value.toString().padStart(6, '0')}`;
}

export const ordersService = {
  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const validation = await cartService.validate(userId);
    if (!validation.valid) {
      throw new AppError('Cart validation failed', 400, ErrorCodes.BAD_REQUEST);
    }

    const address = await prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new AppError('Address not found', 404, ErrorCodes.NOT_FOUND);
    }

    const cart = await cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400, ErrorCodes.BAD_REQUEST);
    }

    const subtotalBeforeDiscount = parseDecimal(validation.totals.subtotal);

    // Coupon validity + discount math via decimal.js (not parseFloat/Number).
    // Usage-limit is re-checked atomically inside the transaction below —
    // this initial check is just for a fast, friendly error before we start.
    let discountAmount = new Decimal(0);
    if (dto.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon?.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        throw new AppError('Invalid or expired coupon', 400, ErrorCodes.BAD_REQUEST);
      }
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', 400, ErrorCodes.BAD_REQUEST);
      }
      if (coupon.minOrderValue && subtotalBeforeDiscount.lt(parseDecimal(coupon.minOrderValue))) {
        throw new AppError('Order does not meet minimum value for coupon', 400, ErrorCodes.BAD_REQUEST);
      }
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = subtotalBeforeDiscount.mul(parseDecimal(coupon.discountValue)).div(100);
        if (coupon.maxDiscount) {
          discountAmount = Decimal.min(discountAmount, parseDecimal(coupon.maxDiscount));
        }
      } else {
        discountAmount = parseDecimal(coupon.discountValue);
      }
    }

    // Shipping charge computed server-side — never trust dto.shippingCharge from the client.
    const subtotalAfterDiscount = subtotalBeforeDiscount.sub(discountAmount);
    const settings = await settingsService.getSettings();
    const shippingCharge = settingsService.computeShippingCharge(settings, subtotalAfterDiscount);
    const gstAmount = parseDecimal(validation.totals.gstAmount);
    const totalAmount = subtotalAfterDiscount.add(gstAmount).add(shippingCharge);

    // COD eligibility is checked against the final payable amount, after
    // discount, GST, and shipping — not the raw cart subtotal.
    if (dto.paymentMethod === PaymentMethod.COD) {
      const codCheck = settingsService.checkCodEligibility(settings, totalAmount);
      if (!codCheck.eligible) {
        throw new AppError(
          codCheck.reason ?? 'Cash on Delivery is not available for this order',
          400,
          ErrorCodes.BAD_REQUEST
        );
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      // Atomic conditional stock reservation — checked and applied in one statement
      // per item, so two concurrent checkouts can't both pass a pre-transaction
      // stock check and both oversell the last unit.
      for (const item of cart.items) {
        const affected = await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET "reservedQty" = "reservedQty" + ${item.quantity}
          WHERE id = ${item.variantId}
            AND "stockQty" - "reservedQty" >= ${item.quantity}
        `;
        if (affected === 0) {
          throw new AppError(
            `Insufficient stock for ${item.product.name} (${item.variant.name})`,
            409,
            ErrorCodes.CONFLICT
          );
        }
      }

      // Atomic conditional coupon usage increment — re-checked at write time in
      // case the usage limit was hit between the initial read above and now.
      if (dto.couponCode) {
        const couponAffected = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usageCount" = "usageCount" + 1
          WHERE code = ${dto.couponCode}
            AND "isActive" = true
            AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
        `;
        if (couponAffected === 0) {
          throw new AppError('Coupon is no longer valid', 400, ErrorCodes.BAD_REQUEST);
        }
      }

      const orderNumber = await generateOrderNumber(tx);

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod,
          subtotal: toDecimal(subtotalAfterDiscount.toString()),
          discountAmount: toDecimal(discountAmount.toString()),
          shippingCharge: toDecimal(shippingCharge.toString()),
          gstAmount: toDecimal(gstAmount.toString()),
          totalAmount: toDecimal(totalAmount.toString()),
          couponCode: dto.couponCode,
          notes: dto.notes,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: cart.items.map((item) => {
              const breakdown = calculateGstBreakdown(
                item.variant.price,
                item.variant.gstPercent,
                item.quantity
              );
              return {
                variantId: item.variantId,
                productName: item.product.name,
                variantName: item.variant.name,
                sku: item.variant.sku,
                quantity: item.quantity,
                unitPrice: item.variant.price,
                gstPercent: item.variant.gstPercent,
                totalPrice: toDecimal(breakdown.total.toString()),
              };
            }),
          },
          payment: {
            create: {
              method: dto.paymentMethod,
              amount: toDecimal(totalAmount.toString()),
              status: PaymentStatus.PENDING,
            },
          },
          statusHistory: {
            create: { status: OrderStatus.PENDING, note: 'Order placed' },
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    notificationService.sendOrderConfirmation(order, order.user).catch((err) => {
      logger.error('Failed to send order confirmation', { orderId: order.id, err });
    });

    return order;
  },

  async getUserOrders(userId: string, query: UserOrdersQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { items: orders, meta: buildPaginationMeta(total, page, limit) };
  },

  async getByOrderNumber(orderNumber: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (userId && order.userId !== userId) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    return order;
  },

  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, user: { select: { id: true, email: true, name: true, phone: true } } },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new AppError('Order cannot be cancelled at this stage', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus:
            order.paymentStatus === PaymentStatus.PAID
              ? PaymentStatus.REFUNDED
              : PaymentStatus.FAILED,
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.CANCELLED, note: 'Cancelled by customer' },
      });

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedQty: { decrement: item.quantity } },
        });
      }
    });

    notificationService.sendOrderCancelled(order, order.user).catch((err) => {
      logger.error('Failed to send cancellation notification', { orderId: order.id, err });
    });
  },

  async requestReturn(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new AppError('Return can only be requested for delivered orders', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RETURN_REQUESTED },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.RETURN_REQUESTED, note: 'Return requested by customer' },
      }),
    ]);
  },

  async getAdminOrders(query: AdminOrdersQuery) {
    const { page, limit, status, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
      ...(from || to
        ? {
            createdAt: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { items: orders, meta: buildPaginationMeta(total, page, limit) };
  },

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { id: true, email: true, name: true, phone: true } } },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Reject illegal status transitions
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowedNext.includes(dto.status)) {
      throw new AppError(
        `Cannot transition order from ${order.status} to ${dto.status}`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }

    // Validate carrier reference, if provided
    if (dto.carrierId) {
      const carrier = await prisma.carrier.findFirst({ where: { id: dto.carrierId, isActive: true } });
      if (!carrier) {
        throw new AppError('Invalid carrier', 400, ErrorCodes.BAD_REQUEST);
      }
    }

    // CANCELLED/RETURN_REQUESTED are exempt — this guard is meant to stop
    // fulfillment progressing without payment, not to block terminating a dead order.
    if (
      !PAYMENT_GUARD_EXEMPT_STATUSES.has(dto.status) &&
      dto.status !== OrderStatus.PENDING &&
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentMethod !== PaymentMethod.COD
    ) {
      throw new AppError('Payment must be completed before status update', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status,
          ...(dto.status === OrderStatus.CANCELLED && {
            paymentStatus:
              order.paymentStatus === PaymentStatus.PAID
                ? PaymentStatus.REFUNDED
                : PaymentStatus.FAILED,
          }),
          ...(dto.trackingId && { trackingId: dto.trackingId }),
          ...(dto.carrierId && { carrierId: dto.carrierId }),
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: dto.status, note: dto.note },
      });

      // Release reserved stock on admin cancellation — the customer-facing
      // cancelOrder already does this; this path did not, leaving stock
      // permanently locked for orders admins cancel.
      if (dto.status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { reservedQty: { decrement: item.quantity } },
          });
        }
      }
    });

    if (dto.status === OrderStatus.SHIPPED && dto.trackingId) {
      notificationService
        .sendOrderShipped(order, order.user, dto.trackingId)
        .catch((err) => logger.error('Failed to send shipped notification', { orderId, err }));
    }

    if (dto.status === OrderStatus.DELIVERED) {
      notificationService
        .sendOrderDelivered(order, order.user)
        .catch((err) => logger.error('Failed to send delivered notification', { orderId, err }));
    }

    if (dto.status === OrderStatus.CANCELLED) {
      notificationService
        .sendOrderCancelled(order, order.user)
        .catch((err) => logger.error('Failed to send cancellation notification', { orderId, err }));
    }
  },
};