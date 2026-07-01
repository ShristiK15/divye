import { z } from 'zod';
import { StockMovementType } from '@divye/database';

export const adjustStockSchema = z.object({
  quantityChange: z.number().int().refine((v) => v !== 0, 'Quantity change cannot be zero'),
  reason: z.string().optional(),
});

export const restockSchema = z.object({
  quantity: z.number().int().positive(),
  supplierId: z.string().cuid().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

export const bulkUpdateRowSchema = z.object({
  sku: z.string(),
  stockQty: z.number().int().min(0),
});

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
export type RestockDto = z.infer<typeof restockSchema>;
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;

export { StockMovementType };
