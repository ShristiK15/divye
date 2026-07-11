import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  prisma,
  Prisma,
} from '@divye/database';
import { calculateGstBreakdown } from '@divye/shared';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { buildPaginationMeta } from '../../utils/response';
import { toDecimal } from '../../utils/decimal';
import { cartService } from '../cart/cart.service';
import { notificationService } from '../notifications/notification.service';
import type {
  AdminOrdersQuery,
  PlaceOrderDto,
  UpdateOrderStatusDto,
  UserOrdersQuery,
} from './orders.types';

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DE-${year}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2], 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(5, '0')}`;
}

const orderInclude = {
  items: true,
  address: true,
  payment: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const } },
  user: { select: { id: true, email: true, name: true, phone: true } },
};

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

    let discountAmount = 0;
    if (dto.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: dto.couponCode } });
      if (!coupon?.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        throw new AppError('Invalid or expired coupon', 400, ErrorCodes.BAD_REQUEST);
      }
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', 400, ErrorCodes.BAD_REQUEST);
      }
      const subtotalNum = parseFloat(validation.totals.subtotal);
      if (coupon.minOrderValue && subtotalNum < Number(coupon.minOrderValue)) {
        throw new AppError('Order does not meet minimum value for coupon', 400, ErrorCodes.BAD_REQUEST);
      }
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = subtotalNum * (Number(coupon.discountValue) / 100);
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
        }
      } else {
        discountAmount = Number(coupon.discountValue);
      }
    }

    const orderNumber = await generateOrderNumber();
    const subtotal = toDecimal(parseFloat(validation.totals.subtotal) - discountAmount);
    const gstAmount = toDecimal(validation.totals.gstAmount);
    const shippingCharge = toDecimal(dto.shippingCharge);
    const totalAmount = toDecimal(
      parseFloat(validation.totals.total) - discountAmount + dto.shippingCharge
    );

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: dto.addressId,
          paymentMethod: dto.paymentMethod,
          subtotal,
          discountAmount: toDecimal(discountAmount),
          shippingCharge,
          gstAmount,
          totalAmount,
          couponCode: dto.couponCode,
          notes: dto.notes,
          status: OrderStatus.PENDING,
          paymentStatus:
            dto.paymentMethod === PaymentMethod.COD
              ? PaymentStatus.PENDING
              : PaymentStatus.PENDING,
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
              amount: totalAmount,
              status: PaymentStatus.PENDING,
            },
          },
          statusHistory: {
            create: { status: OrderStatus.PENDING, note: 'Order placed' },
          },
        },
        include: orderInclude,
      });

      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { reservedQty: { increment: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (dto.couponCode) {
        await tx.coupon.update({
          where: { code: dto.couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    });

    notificationService.sendOrderConfirmation(order, order.user).catch(() => {});

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

    notificationService.sendOrderCancelled(order, order.user).catch(() => {});
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
      include: { user: { select: { id: true, email: true, name: true, phone: true } } },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (
      dto.status !== OrderStatus.PENDING &&
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentMethod !== PaymentMethod.COD
    ) {
      throw new AppError('Payment must be completed before status update', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: dto.status,
          ...(dto.trackingId && { trackingId: dto.trackingId }),
          ...(dto.carrier && { carrier: dto.carrier }),
        },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId, status: dto.status, note: dto.note },
      }),
    ]);

    if (dto.status === OrderStatus.SHIPPED && dto.trackingId) {
      notificationService
        .sendOrderShipped(order, order.user, dto.trackingId)
        .catch(() => {});
    }

    if (dto.status === OrderStatus.DELIVERED) {
      notificationService.sendOrderDelivered(order, order.user).catch(() => {});
    }
  },
};
