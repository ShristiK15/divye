import { z } from 'zod';

export const wishlistQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const moveToCartSchema = z.object({
    variantId: z.string().cuid(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export type WishlistQuery = z.infer<typeof wishlistQuerySchema>;
export type MoveToCartDto = z.infer<typeof moveToCartSchema>;