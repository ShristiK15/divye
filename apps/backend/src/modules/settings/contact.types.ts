import { z } from 'zod';

// Public-facing business contact details — storefront footer, contact
// page, checkout, and printed on invoices. Phone/WhatsApp are validated
// loosely (Indian numbers with or without +91, spaces, hyphens) rather
// than a strict E.164 regex, since this is admin-entered display text,
// not something dialed programmatically.
const phoneRegex = /^[+\d][\d\s-]{7,15}$/;

export const updateContactDetailsSchema = z.object({
    supportPhone: z.string().regex(phoneRegex, 'Enter a valid phone number').or(z.literal('')),
    supportWhatsapp: z.string().regex(phoneRegex, 'Enter a valid WhatsApp number').or(z.literal('')),
    supportEmail: z.string().email('Enter a valid email address').or(z.literal('')),
    businessAddress: z.string().max(500),
    businessHours: z.string().max(200),
});

export type UpdateContactDetailsDto = z.infer<typeof updateContactDetailsSchema>;