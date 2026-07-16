import { z } from 'zod';

// Site-wide admin-configurable settings. Add new fields here as more
// settings are needed rather than spinning up a new singleton table per concern.
export const updateAppSettingsSchema = z
  .object({
    freeShippingThreshold: z.number().min(0),
    flatShippingCharge: z.number().min(0),
    codEnabled: z.boolean(),
    codMinOrderValue: z.number().min(0),
    // null = no upper limit on COD orders
    codMaxOrderValue: z.number().min(0).nullable(),
  })
  .refine(
    (data) => data.codMaxOrderValue === null || data.codMaxOrderValue >= data.codMinOrderValue,
    { message: 'codMaxOrderValue must be greater than or equal to codMinOrderValue', path: ['codMaxOrderValue'] }
  );

export type UpdateAppSettingsDto = z.infer<typeof updateAppSettingsSchema>;