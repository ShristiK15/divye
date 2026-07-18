import crypto from 'crypto';
import Razorpay from 'razorpay';
import Decimal from 'decimal.js';
import { parseDecimal } from '@divye/shared/utils/decimal';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  prisma,
  StockMovementType,
} from '@divye/database';
import { env } from '../../config/env';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { notificationService } from '../notifications/notification.service';
import type { CodConfirmDto, RazorpayCreateOrderDto, RazorpayVerifyDto } from './payments.types';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

// Converts a rupee Decimal amount to integer paise the way Razorpay requires.
// Does the *100 in Decimal space (not native float) and rounds explicitly,
// rather than relying on Math.round to paper over float drift after the
// multiply — same reasoning as the decimal.js migration in cart.
function toPaise(amount: Decimal.Value): number {
  return parseDecimal(amount).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

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

  const fulfilled = await prisma.$transaction(async (tx) => {
    // Atomic guard: only proceed if payment isn't already PAID.
    // Prevents double-fulfillment when verify() and the webhook race.
    const paymentUpdate = await tx.payment.updateMany({
      where: { orderId, status: { not: PaymentStatus.PAID } },
      data: { status: PaymentStatus.PAID },
    });
    if (paymentUpdate.count === 0) {
      return false;
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      },
   });

    await tx.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.CONFIRMED, note: 'Payment confirmed' },
    });

    await decrementStockForOrder(tx, order);

   return true;
  });

  if (!fulfilled) return;

  notificationService.sendOrderConfirmation(order, order.user).catch(() => {});
}

async function releaseReservedStock(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: { select: { id: true, email: true, name: true, phone: true } } },
  });

  if (!order) return;

 const released = await prisma.$transaction(async (tx) => {
   // Atomic guard: skip if payment already reached a terminal state
   // (PAID by a concurrent verify(), or already FAILED by a prior call).
   const paymentUpdate = await tx.payment.updateMany({
     where: { orderId, status: { notIn: [PaymentStatus.PAID, PaymentStatus.FAILED] } },
     data: { status: PaymentStatus.FAILED },
   });

   if (paymentUpdate.count === 0) {
     return false;
   }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reservedQty: { decrement: item.quantity } },
      });
    }

   return true;
  });

  if (!released) return;
  notificationService.sendOrderCancelled(order, order.user).catch(() => {});
}

async function decrementStockForOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; orderNumber: string; items: { variantId: string; quantity: number }[] }
): Promise<void> {
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

    const amountPaise = toPaise(order.totalAmount);

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

    if (order.payment.razorpayOrderId !== dto.razorpay_order_id) {
      throw new AppError('Razorpay order ID mismatch', 400, ErrorCodes.BAD_REQUEST);
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
        refund?: { entity: { id: string; payment_id: string; amount: number; status: string } };
      };
    };

   // Atomic dedup: try to record this event as seen. The unique constraint
   // on eventKey means a concurrent or retried delivery of the exact same
   // event will fail this insert with P2002 — caught below and treated as
   // "already processed," not an error. This runs before any business
   // logic, so it protects every branch below (and any added later)
   // without each one needing its own idempotency guard.
   // Dedup key varies by event shape — payment events key on the payment
   // entity id, refund events key on the refund entity id (Razorpay payloads
   // for refund.processed nest a refund entity, not just a payment entity).
   const dedupEntityId =
     payload.payload.payment?.entity.id ?? payload.payload.refund?.entity.id;
   if (!dedupEntityId) return;
     
   const eventKey = `${payload.event}:${dedupEntityId}`;
   try {
     await prisma.webhookEvent.create({
       data: { eventKey, eventType: payload.event },
     });
   } catch (err) {
     if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
       return; // Duplicate delivery — already handled, skip silently.
     }
     throw err;
   }


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
    
    if (payload.event === 'refund.processed') {
      const refundEntity = payload.payload.refund?.entity;
      if (!refundEntity) return;
    
      // Reconciliation safety net: closes two gaps in initiateRefund —
      // (a) a crash between the Razorpay call succeeding and our final DB
      //     transaction committing, which leaves the payment stuck at
      //     REFUND_PROCESSING forever with no self-correction, and
      // (b) a network timeout on the refund() call that we wrongly treated
      //     as a failure and rolled back to PAID, even though Razorpay had
      //     already processed it.
      // If the normal initiateRefund flow already completed cleanly, the
      // payment is already REFUNDED and this is a no-op via the where clause.
      const payment = await prisma.payment.findFirst({
        where: { razorpayPaymentId: refundEntity.payment_id },
      });
    
      if (!payment) return;
    
      const refundedAmount = parseDecimal(refundEntity.amount).div(100);
      const orderTotal = parseDecimal(payment.amount);
      const isFullRefund = refundedAmount.gte(orderTotal);
      const finalPaymentStatus = isFullRefund
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;
    
      await prisma.$transaction(async (tx) => {
        const claim = await tx.payment.updateMany({
          where: {
            orderId: payment.orderId,
            status: { in: [PaymentStatus.PAID, PaymentStatus.REFUND_PROCESSING] },
          },
          data: {
            status: finalPaymentStatus,
            refundId: refundEntity.id,
            refundAmount: refundedAmount.toString(),
          },
        });
      
        if (claim.count === 0) return; // already reconciled — nothing to do

        const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: finalPaymentStatus,
            ...(isFullRefund && { status: OrderStatus.REFUNDED }),
          },
        });
      
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            // Full refund: order transitions to REFUNDED, log that.
            // Partial refund: order status is unchanged (still CANCELLED or
            // RETURNED) — log the current status, since this is a payment-side
            // event being recorded, not an order status transition.
            status: isFullRefund ? OrderStatus.REFUNDED : order.status,
            note: `Refund reconciled via webhook: ${refundEntity.id}`,
          },
        });
      });
    }
  },

  async confirmCod(dto: CodConfirmDto, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: dto.orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (order.paymentMethod !== PaymentMethod.COD) {
      throw new AppError('Order is not a COD order', 400, ErrorCodes.BAD_REQUEST);
    }
    const confirmed = await prisma.$transaction(async (tx) => {
     // Atomic guard: skip if this order was already confirmed
     // (duplicate/retried confirm request).
     const orderUpdate = await tx.order.updateMany({
       where: { id: order.id, status: { not: OrderStatus.CONFIRMED } },
       data: {
         status: OrderStatus.CONFIRMED,
         paymentStatus: PaymentStatus.PENDING,
       },
     });

     if (orderUpdate.count === 0) {
       return false;
     }

     await tx.orderStatusHistory.create({
       data: { orderId: order.id, status: OrderStatus.CONFIRMED, note: 'COD order confirmed' },
     });

     await decrementStockForOrder(tx, order);

     return true;
   });

   if (!confirmed) {
     throw new AppError('Order already confirmed', 409, ErrorCodes.CONFLICT);
   }


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

    if (order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RETURNED) {
      throw new AppError(
        'Order must be cancelled or returned before it can be refunded',
        400,
        ErrorCodes.BAD_REQUEST
      );
    }

    if (order.paymentStatus !== PaymentStatus.PAID || !order.payment.razorpayPaymentId) {
      throw new AppError('No paid Razorpay payment to refund', 400, ErrorCodes.BAD_REQUEST);
    }

   const claim = await prisma.payment.updateMany({
     where: { orderId, status: PaymentStatus.PAID },
     data: { status: PaymentStatus.REFUND_PROCESSING },
   });

   if (claim.count === 0) {
     throw new AppError('Refund already in progress or completed', 409, ErrorCodes.CONFLICT);
   }

    const amountPaise = toPaise(order.totalAmount);

   let refund;
   try {
     refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
       amount: amountPaise,
     });
   } catch (err) {
     await prisma.payment.updateMany({
       where: { orderId, status: PaymentStatus.REFUND_PROCESSING },
       data: { status: PaymentStatus.PAID },
     });
     throw err;
   }

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
