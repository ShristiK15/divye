import { z } from 'zod';

export const productSalesQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const acquisitionQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).default('month'),
});

export type ProductSalesQuery = z.infer<typeof productSalesQuerySchema>;
export type AcquisitionQuery = z.infer<typeof acquisitionQuerySchema>;
