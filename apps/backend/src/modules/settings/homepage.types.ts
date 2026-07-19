import { z } from 'zod';

// Types and validation schemas for admin-configurable homepage content.
// Each section (hero images today; banners, featured categories, promo
// text, etc. later) gets its own clearly-labeled block below so this file
// can grow without becoming a junk drawer.

// --- Hero images ---------------------------------------------------------
//
// Backed by its own `HeroImage` Prisma model (see NOTES.md) — same
// relational pattern as ProductImage: url is the Cloudinary secure_url,
// publicId is the Cloudinary asset id needed to delete the file later.

// Body for PUT /api/admin/settings/homepage/hero-images/order
// `order` is the full list of hero image ids in the desired display order.
export const heroImageOrderSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});

export type ReorderHeroImagesDto = z.infer<typeof heroImageOrderSchema>;

// Body for PATCH /api/admin/settings/homepage/hero-images/:id
export const updateHeroImageAltSchema = z.object({
  altText: z.string().max(200),
});

export type UpdateHeroImageAltDto = z.infer<typeof updateHeroImageAltSchema>;

// --- Future sections ------------------------------------------------------
// export const bannerSchema = z.object({ ... });
// export const featuredCategoriesSchema = z.object({ ... });