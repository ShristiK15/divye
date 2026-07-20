import { z } from 'zod';

const pincodeRegex = /^[1-9][0-9]{5}$/;
const phoneRegex = /^[6-9]\d{9}$/;

export const addressBaseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().regex(pincodeRegex, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean().optional().default(false),
});

export const createAddressSchema = addressBaseSchema;
export const updateAddressSchema = addressBaseSchema.partial();

export type CreateAddressDto = z.infer<typeof createAddressSchema>;
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>;