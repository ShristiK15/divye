import { z } from 'zod';

const variantSchema = z.object({
  id: z.string().cuid().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  mrp: z.coerce.number().positive(),
  gstPercent: z.coerce.number().refine((v) => [5, 12, 18, 28].includes(v), 'Invalid GST rate'),
  hsnCode: z.string().optional(),
  stockQty: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  supplierId: z.string().cuid().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
});

const specSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

const seoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  focusKeyword: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  categoryId: z.string().cuid(),
  brand: z.string().min(1),
  slug: z.string().min(1).optional(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().default(false),
  variants: z.array(variantSchema).min(1),
  specifications: z.array(specSchema).optional(),
  seo: seoSchema.optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().cuid().optional(),
  brand: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  variants: z.array(variantSchema).min(1).optional(),
  specifications: z.array(specSchema).optional(),
  seo: seoSchema.optional(),
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'relevance', 'rating']).default('newest'),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export type ProductListVariant = {
  id: string;
  sku: string;
  price: string;
  mrp: string;
  gstPercent: string;
  stockQty: number;
};

export type ProductListItem = {
  id: string;
  name: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  primaryImage: string | null;
  category: { id: string; name: string; slug: string };
  variant: ProductListVariant | null;
};
