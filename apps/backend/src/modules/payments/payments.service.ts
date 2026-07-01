import crypto from 'crypto';
import Razorpay from 'razorpay';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  prisma,
  StockMovementType,
} from '@divye/database';
import { env } from '../../config/env';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { decimalToNumber } from '../../utils/decimal';
import { notificationService } from '../notifications/notification.service';
import type { CodConfirmDto, RazorpayCreateOrderDto, RazorpayVerifyDto } from './payments.types';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

async function fulfillPayment(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
  });

  if (!order) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      },
    });

    await tx.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.PAID },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.CONFIRMED, note: 'Payment confirmed' },
    });

    for (const item of order.items) {
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
      if (!variant) continue;

      const quantityBefore = variant.stockQty;
      const quantityAfter = quantityBefore - item.quantity;

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQty: { decrement: item.quantity },
          reservedQty: { decrement: item.quantity },
        },
      });

      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          type: StockMovementType.SALE,
          quantityBefore,
          quantityChange: -item.quantity,
          quantityAfter,
          reference: order.orderNumber,
        },
      });
    }
  });

  notificationService.sendOrderConfirmation(order, order.user).catch(() => {});
}

async function releaseReservedStock(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { id: true, email: true, name: true, phone: true } } },
  });

  if (!order) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    await tx.payment.update({
      where: { orderId },
      data: { status: PaymentStatus.FAILED },
    });

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reservedQty: { decrement: item.quantity } },
      });
    }
  });

  notificationService.sendOrderCancelled(order, order.user).catch(() => {});
}

export const paymentsService = {
  async createRazorpayOrder(dto: RazorpayCreateOrderDto, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { payment: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.paymentMethod !== PaymentMethod.RAZORPAY) {
      throw new AppError('Order is not a Razorpay order', 400, ErrorCodes.BAD_REQUEST);
    }

    const amountPaise = Math.round(decimalToNumber(order.totalAmount) * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber,
    });

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  async verifyRazorpayPayment(dto: RazorpayVerifyDto, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { payment: true },
    });

    if (!order?.payment) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    const valid = verifyRazorpaySignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature
    );

    if (!valid) {
      throw new AppError('Invalid payment signature', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        razorpayPaymentId: dto.razorpay_payment_id,
        razorpaySignature: dto.razorpay_signature,
      },
    });

    await fulfillPayment(order.id);

    return { success: true };
  },

  async handleWebhook(rawBody: string, signature: string) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      throw new AppError('Invalid webhook signature', 400, ErrorCodes.BAD_REQUEST);
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: { entity: { order_id: string; id: string; status: string } };
      };
    };

    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment?.entity;
      if (!paymentEntity) return;

      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      });

      if (payment && payment.status !== PaymentStatus.PAID) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { razorpayPaymentId: paymentEntity.id },
        });
        await fulfillPayment(payment.orderId);
      }
    }

    if (payload.event === 'payment.failed') {
      const paymentEntity = payload.payload.payment?.entity;
      if (!paymentEntity) return;

      const payment = await prisma.payment.findFirst({
        where: { razorpayOrderId: paymentEntity.order_id },
      });

      if (payment) {
        await releaseReservedStock(payment.orderId);
      }
    }
  },

  async confirmCod(dto: CodConfirmDto, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new AppError('Order is not a COD order', 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PENDING,
        },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId: order.id, status: OrderStatus.CONFIRMED, note: 'COD order confirmed' },
      }),
    ]);

    return { success: true };
  },

  async initiateRefund(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order?.payment) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.paymentStatus !== PaymentStatus.PAID || !order.payment.razorpayPaymentId) {
      throw new AppError('No paid Razorpay payment to refund', 400, ErrorCodes.BAD_REQUEST);
    }

    const amountPaise = Math.round(decimalToNumber(order.totalAmount) * 100);

    const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
      amount: amountPaise,
    });

    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundId: refund.id,
          refundAmount: order.totalAmount,
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED },
      }),
      prisma.orderStatusHistory.create({
        data: { orderId, status: OrderStatus.REFUNDED, note: `Refund initiated: ${refund.id}` },
      }),
    ]);

    return { refundId: refund.id };
  },
};
