import { z } from 'zod';

export const createCarrierSchema = z.object({
  label: z.string().min(2).max(100),
  trackingUrlTemplate: z.string().url().optional().or(z.literal('')),
});

export const carrierIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCarrierDto = z.infer<typeof createCarrierSchema>;