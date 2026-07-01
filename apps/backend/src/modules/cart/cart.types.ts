import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

export type CartValidationResult = {
  valid: boolean;
  issues: Array<{
    itemId: string;
    message: string;
  }>;
  totals: {
    subtotal: string;
    gstAmount: string;
    total: string;
  };
};
