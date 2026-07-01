import { z } from 'zod';

export const razorpayCreateOrderSchema = z.object({
  orderId: z.string().cuid(),
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  orderId: z.string().cuid(),
});

export const codConfirmSchema = z.object({
  orderId: z.string().cuid(),
});

export type RazorpayCreateOrderDto = z.infer<typeof razorpayCreateOrderSchema>;
export type RazorpayVerifyDto = z.infer<typeof razorpayVerifySchema>;
export type CodConfirmDto = z.infer<typeof codConfirmSchema>;
