import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@divye/database';

export const placeOrderSchema = z.object({
  addressId: z.string().cuid(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  shippingCharge: z.number().min(0).default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().optional(),
  trackingId: z.string().optional(),
  carrier: z.string().optional(),
});

export const adminOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const userOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PlaceOrderDto = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type UserOrdersQuery = z.infer<typeof userOrdersQuerySchema>;

export { OrderStatus, PaymentMethod };
