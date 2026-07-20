import { prisma } from '@divye/database';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { mapPrismaError } from '../../utils/prisma-error';
import { buildPaginationMeta } from '../../utils/response';
import type { WishlistQuery, MoveToCartDto } from './wishlist.types';
import { cartService } from '../cart/cart.service';

export const wishlistService = {
    async add(userId: string, productId: string) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product?.isActive) {
            throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
        }

        try {
            return await prisma.wishlistItem.create({ data: { userId, productId } });
        } catch (error) {
            // Race: two rapid-fire adds (double-tap on a slow connection) both pass
            // through, second one hits the userId_productId unique constraint.
            throw mapPrismaError(error);
        }
    },

    async remove(userId: string, productId: string): Promise<void> {
        try {
            await prisma.wishlistItem.delete({
                where: { userId_productId: { userId, productId } },
            });
        } catch (error) {
            throw mapPrismaError(error);
        }
    },

    async toggle(userId: string, productId: string): Promise<{ inWishlist: boolean }> {
        const existing = await prisma.wishlistItem.findUnique({
            where: { userId_productId: { userId, productId } },
        });

        if (existing) {
            await prisma.wishlistItem.delete({ where: { id: existing.id } });
            return { inWishlist: false };
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product?.isActive) {
            throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
        }

        try {
            await prisma.wishlistItem.create({ data: { userId, productId } });
            return { inWishlist: true };
        } catch (error) {
            // Race: two toggle taps in quick succession both see "not present" and
            // both try to create — second hits the unique constraint. Since the
            // net intent either way is "it's in the wishlist now," treat P2002
            // here as success rather than surfacing a 409 for a double-tap.
            if (error instanceof Error && 'code' in error && error.code === 'P2002') {
                return { inWishlist: true };
            }
            throw mapPrismaError(error);
        }
    },

    async list(userId: string, query: WishlistQuery) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.wishlistItem.findMany({
                where: { userId },
                select: { productId: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.wishlistItem.count({ where: { userId } }),
        ]);

        return {
            items: items.map((i) => i.productId),
            meta: buildPaginationMeta(total, page, limit),
        };
    },

    async moveToCart(userId: string, productId: string, dto: MoveToCartDto) {
        const wishlistItem = await prisma.wishlistItem.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (!wishlistItem) {
            throw new AppError('Product not found in wishlist', 404, ErrorCodes.NOT_FOUND);
        }

        const cart = await cartService.addItem(userId, {
            productId,
            variantId: dto.variantId,
            quantity: dto.quantity,
        });

        await prisma.wishlistItem.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        return cart;
    }
};