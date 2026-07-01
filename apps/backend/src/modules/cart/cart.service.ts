import { prisma } from '@divye/database';
import { calculateGstBreakdown } from '@divye/shared';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { getAvailableQty } from '../../utils/decimal';
import type { AddCartItemDto, CartValidationResult, UpdateCartItemDto } from './cart.types';

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
    const [product, variant] = await Promise.all([
      prisma.product.findUnique({ where: { id: dto.productId } }),
      prisma.productVariant.findUnique({ where: { id: dto.variantId } }),
    ]);

    if (!product?.isActive || !variant?.isActive || variant.productId !== dto.productId) {
      throw new AppError('Product or variant not available', 400, ErrorCodes.BAD_REQUEST);
    }

    const available = getAvailableQty(variant.stockQty, variant.reservedQty);
    if (dto.quantity > available) {
      throw new AppError(`Only ${available} units available`, 400, ErrorCodes.BAD_REQUEST);
    }

    const cart = await getOrCreateCart(userId);

    const existing = cart.items.find((i) => i.variantId === dto.variantId);
    const newQty = (existing?.quantity ?? 0) + dto.quantity;

    if (newQty > available) {
      throw new AppError(`Only ${available} units available`, 400, ErrorCodes.BAD_REQUEST);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return getOrCreateCart(userId);
  },

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
    }

    const available = getAvailableQty(item.variant.stockQty, item.variant.reservedQty);
    if (dto.quantity > available) {
      throw new AppError(`Only ${available} units available`, 400, ErrorCodes.BAD_REQUEST);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return getOrCreateCart(userId);
  },

  async removeItem(userId: string, itemId: string): Promise<void> {
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new AppError('Cart item not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
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
    let subtotal = 0;
    let gstAmount = 0;

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
      subtotal += breakdown.subtotal;
      gstAmount += breakdown.gstAmount;
    }

    return {
      valid: issues.length === 0 && cart.items.length > 0,
      issues,
      totals: {
        subtotal: subtotal.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        total: (subtotal + gstAmount).toFixed(2),
      },
    };
  },
};
