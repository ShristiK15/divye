import { Prisma, prisma } from '@divye/database';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { mapPrismaError } from '../../utils/prisma-error';
import type { UpsertSeoDto } from './seo.types';

export const seoService = {
  async getByProductId(productId: string, isAdmin: boolean) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || (!product.isActive && !isAdmin)) {
      // 404, not 403, for the inactive+non-admin case — same pattern as
      // products/categories: don't confirm existence of a deactivated
      // product to an unauthenticated caller.
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    const seo = await prisma.productSeo.findUnique({ where: { productId } });
    if (!seo) {
      throw new AppError('SEO data not found', 404, ErrorCodes.NOT_FOUND);
    }

    return { ...seo, slug: product.slug };
  },

  async upsert(productId: string, dto: UpsertSeoDto) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    try {
      const seo = await prisma.productSeo.upsert({
        where: { productId },
        create: {
          productId,
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
          structuredData: (dto.structuredData ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });

      return { ...seo, slug: product.slug };
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

  async generateSitemap(): Promise<string> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
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
