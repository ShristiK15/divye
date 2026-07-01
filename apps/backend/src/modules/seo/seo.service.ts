import { Prisma, prisma } from '@divye/database';
import { generateSlug, ensureUniqueSlug } from '@divye/shared';
import { AppError, ErrorCodes } from '../../utils/app-error';
import type { UpsertSeoDto } from './seo.types';

export const seoService = {
  async getByProductId(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    const seo = await prisma.productSeo.findUnique({ where: { productId } });
    if (!seo) {
      throw new AppError('SEO data not found', 404, ErrorCodes.NOT_FOUND);
    }

    return seo;
  },

  async upsert(productId: string, dto: UpsertSeoDto) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    const baseSlug = dto.slug ?? generateSlug(product.name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.productSeo.findUnique({ where: { slug: s } });
      return existing !== null && existing.productId !== productId;
    });

    const seo = await prisma.productSeo.upsert({
      where: { productId },
      create: {
        productId,
        slug,
        metaTitle: dto.metaTitle ?? product.name,
        metaDescription: dto.metaDescription ?? product.description.slice(0, 160),
        focusKeyword: dto.focusKeyword,
        keywords: dto.keywords ?? [],
        ogTitle: dto.ogTitle,
        ogDescription: dto.ogDescription,
        ogImage: dto.ogImage,
        canonicalUrl: dto.canonicalUrl,
        structuredData: (dto.structuredData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {
        ...dto,
        slug,
        structuredData: (dto.structuredData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    return seo;
  },

  async generateSitemap(): Promise<string> {
    const products = await prisma.productSeo.findMany({
      where: { product: { isActive: true } },
      select: { slug: true, updatedAt: true },
    });

    const urls = products
      .map(
        (p) => `  <url>
    <loc>https://divyeelectronics.in/products/${p.slug}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  },
};
