import { z } from 'zod';

export const upsertSeoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(320).optional(),
  slug: z.string().min(2).optional(),
  focusKeyword: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  structuredData: z.record(z.unknown()).optional(),
});

export type UpsertSeoDto = z.infer<typeof upsertSeoSchema>;
