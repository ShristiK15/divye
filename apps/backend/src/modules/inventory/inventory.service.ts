import { prisma, StockMovementType } from '@divye/database';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { appEvents, AppEventTypes } from '../../utils/events';
import { buildPaginationMeta } from '../../utils/response';
import { getAvailableQty } from '../../utils/decimal';
import { notificationService } from '../notifications/notification.service';
import type { AdjustStockDto, InventoryListQuery, RestockDto } from './inventory.types';

async function logStockChange(params: {
  variantId: string;
  type: StockMovementType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason?: string;
  reference?: string;
  createdBy?: string;
}): Promise<void> {
  await prisma.inventoryLog.create({ data: params });
}

async function updateStockAndLog(
  variantId: string,
  quantityChange: number,
  type: StockMovementType,
  options: { reason?: string; reference?: string; createdBy?: string } = {}
): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant) {
    throw new AppError('Variant not found', 404, ErrorCodes.NOT_FOUND);
  }

  const quantityBefore = variant.stockQty;
  const quantityAfter = quantityBefore + quantityChange;

  if (quantityAfter < 0) {
    throw new AppError('Insufficient stock for adjustment', 400, ErrorCodes.BAD_REQUEST);
  }

  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: quantityAfter },
    }),
    prisma.inventoryLog.create({
      data: {
        variantId,
        type,
        quantityBefore,
        quantityChange,
        quantityAfter,
        reason: options.reason,
        reference: options.reference,
        createdBy: options.createdBy,
      },
    }),
  ]);

  if (quantityAfter <= variant.lowStockThreshold) {
    appEvents.emit(AppEventTypes.LOW_STOCK, {
      variantId,
      productId: variant.productId,
      stockQty: quantityAfter,
      threshold: variant.lowStockThreshold,
    });
    notificationService
      .sendLowStockAlert(variant, variant.product)
      .catch(() => {});
  }
}

export const inventoryService = {
  async list(query: InventoryListQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where: { isActive: true },
        include: {
          product: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: [{ stockQty: 'asc' }, { sku: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.productVariant.count({ where: { isActive: true } }),
    ]);

    const items = variants.map((v) => ({
      ...v,
      availableQty: getAvailableQty(v.stockQty, v.reservedQty),
      isLowStock: v.stockQty <= v.lowStockThreshold,
    }));

    return { items, meta: buildPaginationMeta(total, page, limit) };
  },

  async getLowStock() {
    const variants = await prisma.$queryRaw<
      Array<{
        id: string;
        sku: string;
        name: string;
        stockQty: number;
        reservedQty: number;
        lowStockThreshold: number;
        productId: string;
        productName: string;
      }>
    >`
      SELECT
        pv."id",
        pv."sku",
        pv."name",
        pv."stockQty",
        pv."reservedQty",
        pv."lowStockThreshold",
        pv."productId",
        p."name" as "productName"
      FROM "ProductVariant" pv
      JOIN "Product" p ON pv."productId" = p."id"
      WHERE pv."isActive" = true
      AND pv."stockQty" <= pv."lowStockThreshold"
      ORDER BY pv."stockQty" ASC
    `;

    return variants;
  },

  async getLogs(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError('Variant not found', 404, ErrorCodes.NOT_FOUND);
    }

    return prisma.inventoryLog.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async adjust(variantId: string, dto: AdjustStockDto, adminId: string): Promise<void> {
    await updateStockAndLog(variantId, dto.quantityChange, StockMovementType.MANUAL_ADJUSTMENT, {
      reason: dto.reason,
      createdBy: adminId,
    });
  },

  async restock(variantId: string, dto: RestockDto, adminId: string): Promise<void> {
    if (dto.supplierId) {
      const supplier = await prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new AppError('Supplier not found', 404, ErrorCodes.NOT_FOUND);
      }
    }

    await updateStockAndLog(variantId, dto.quantity, StockMovementType.RESTOCK, {
      reason: dto.reason,
      reference: dto.reference,
      createdBy: adminId,
    });

    if (dto.supplierId) {
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { supplierId: dto.supplierId },
      });
    }
  },

  async bulkUpdate(csvContent: string, adminId: string): Promise<{ updated: number; errors: string[] }> {
    const lines = csvContent.trim().split('\n');
    const errors: string[] = [];
    let updated = 0;

    for (let i = 1; i < lines.length; i++) {
      const [sku, qtyStr] = lines[i].split(',').map((s) => s.trim());
      const stockQty = parseInt(qtyStr, 10);

      if (!sku || isNaN(stockQty) || stockQty < 0) {
        errors.push(`Line ${i + 1}: Invalid data`);
        continue;
      }

      const variant = await prisma.productVariant.findUnique({ where: { sku } });
      if (!variant) {
        errors.push(`Line ${i + 1}: SKU ${sku} not found`);
        continue;
      }

      const change = stockQty - variant.stockQty;
      if (change !== 0) {
        await updateStockAndLog(variant.id, change, StockMovementType.MANUAL_ADJUSTMENT, {
          reason: 'Bulk CSV update',
          createdBy: adminId,
        });
        updated += 1;
      }
    }

    return { updated, errors };
  },

  logStockChange,
  updateStockAndLog,
};
