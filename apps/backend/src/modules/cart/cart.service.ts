import { prisma } from '@divye/database';
import { calculateGstBreakdown } from '@divye/shared';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { getAvailableQty } from '../../utils/decimal';
import type { AddCartItemDto, CartValidationResult, UpdateCartItemDto } from './cart.types';
import Decimal from 'decimal.js';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          isActive: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          mrp: true,
          gstPercent: true,
          stockQty: true,
          reservedQty: true,
          isActive: true,
        },
      },
    },
  },
};

type VariantLockRow = {
  id: string;
  isActive: boolean;
  productId: string;
  stockQty: number;
  reservedQty: number;
};

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }

  return cart;
}

export const cartService = {
  async getCart(userId: string) {
    return getOrCreateCart(userId);
  },

  async addItem(userId: string, dto: AddCartItemDto) {
      try {
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.findUnique({ where: { id: dto.productId } });
          if (!product?.isActive) {
            throw new AppError('Product or variant not available', 400, ErrorCodes.BAD_REQUEST);
          }

        // Lock the variant row for the duration of this transaction so
        // concurrent addItem calls for the same variant serialize instead
        // of both reading the same stale stockQty/reservedQty and both
        // passing their availability check.
        const variantRows = await tx.$queryRaw<VariantLockRow[]>`
          SELECT id, "isActive", "productId", "stockQty", "reservedQty"
          FROM "ProductVariant"
          WHERE id = ${dto.variantId}
          FOR UPDATE
        `;
        const variant = variantRows[0];

        if (!variant?.isActive || variant.productId !== dto.productId) {
          throw new AppError('Product or variant not available', 400, ErrorCodes.BAD_REQUEST);
        }

        const available = getAvailableQty(variant.stockQty, variant.reservedQty);

        const cart = await tx.cart.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        const existing = await tx.cartItem.findUnique({
          where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
        });
        const newQty = (existing?.quantity ?? 0) + dto.quantity;

        if (newQty > available) {
          throw new AppError(`Only ${available} units available`, 400, ErrorCodes.BAD_REQUEST);
        }

        await tx.cartItem.upsert({
          where: { cartId_variantId: { cartId: cart.id, variantId: dto.variantId } },
          update: { quantity: { increment: dto.quantity } },
          create: {
            cartId: cart.id,
            productId: dto.productId,
            variantId: dto.variantId,
            quantity: dto.quantity,
          },
        });
      },
      { maxWait: 5000, timeout: 10000 }
    );
     } catch (error) {
      if (error instanceof AppError) {
        throw error; // deliberate business-logic rejection — pass through as-is
      }
      // Prisma-level failure: lock wait timeout, deadlock, or transaction
      // timeout under heavy concurrent load on a hot-selling variant.
      throw new AppError(
        'Could not update cart right now, please try again',
        409,
        ErrorCodes.CONFLICT
      );
    }
      return getOrCreateCart(userId);
    },

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
      try {
        await prisma.$transaction(async (tx) => {
          const cart = await tx.cart.findUnique({ where: { userId } });
          if (!cart) {
            throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
          }

        const item = await tx.cartItem.findFirst({
          where: { id: itemId, cartId: cart.id },
        });
        if (!item) {
          throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
        }

        // Lock the variant row so a concurrent addItem/updateItem for the
        // same variant can't read stale stockQty/reservedQty and both pass
        // their availability check.
        const variantRows = await tx.$queryRaw<VariantLockRow[]>`
          SELECT id, "isActive", "productId", "stockQty", "reservedQty"
          FROM "ProductVariant"
          WHERE id = ${item.variantId}
          FOR UPDATE
        `;
        const variant = variantRows[0];

        if (!variant) {
          throw new AppError('Product or variant not available', 400, ErrorCodes.BAD_REQUEST);
        }

        const available = getAvailableQty(variant.stockQty, variant.reservedQty);
        if (dto.quantity > available) {
          throw new AppError(`Only ${available} units available`, 400, ErrorCodes.BAD_REQUEST);
        }

        await tx.cartItem.update({
          where: { id: itemId },
          data: { quantity: dto.quantity },
        });
      },
      { maxWait: 5000, timeout: 10000 }
    );
     } catch (error) {
      if (error instanceof AppError) {
        throw error; // deliberate business-logic rejection — pass through as-is
      }
      // Prisma-level failure: lock wait timeout, deadlock, or transaction
      // timeout under heavy concurrent load on a hot-selling variant.
      throw new AppError(
        'Could not update cart right now, please try again',
        409,
        ErrorCodes.CONFLICT
      );
    }

      return getOrCreateCart(userId);
    },

  async removeItem(userId: string, itemId: string): Promise<void> {
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
      }

      const { count } = await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });

      if (count === 0) {
        throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
      }
    },

  async clearCart(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },

  async validate(userId: string): Promise<CartValidationResult> {
    const cart = await getOrCreateCart(userId);
    const issues: CartValidationResult['issues'] = [];
    let subtotal = new Decimal(0);
    let gstAmount = new Decimal(0);

    for (const item of cart.items) {
      if (!item.product.isActive || !item.variant.isActive) {
        issues.push({ itemId: item.id, message: 'Product no longer available' });
        continue;
      }

      const available = getAvailableQty(item.variant.stockQty, item.variant.reservedQty);
      if (item.quantity > available) {
        issues.push({
          itemId: item.id,
          message: `Only ${available} units available for ${item.variant.name}`,
        });
      }

      const breakdown = calculateGstBreakdown(
        item.variant.price,
        item.variant.gstPercent,
        item.quantity
      );
      subtotal = subtotal.plus(breakdown.subtotal);
      gstAmount = gstAmount.plus(breakdown.gstAmount);
    }

    const total = subtotal.plus(gstAmount);

    return {
      valid: issues.length === 0 && cart.items.length > 0,
      issues,
      totals: {
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        total: total.toFixed(2),
      },
    };
  },
};
