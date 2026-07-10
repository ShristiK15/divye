import { Prisma, prisma } from '@divye/database';
import { generateSlug, ensureUniqueSlug } from '@divye/shared';
import { cloudinary } from '../../config/cloudinary';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { buildPaginationMeta } from '../../utils/response';
import { toDecimal } from '../../utils/decimal';
import { getAvailableQty } from '../../utils/decimal';
import type {
  CreateProductDto,
  ProductListItem,
  ProductListQuery,
  UpdateProductDto,
} from './products.types';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } },
  specifications: { orderBy: { sortOrder: 'asc' as const } },
  seo: true,
} satisfies Prisma.ProductInclude;

function mapListItem(product: {
  id: string;
  name: string;
  brand: string;
  isActive: boolean;  
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: Array<{ url: string; isPrimary: boolean }>;
  variants: Array<{
    id: string;
    sku: string;
    price: Prisma.Decimal;
    mrp: Prisma.Decimal;
    gstPercent: Prisma.Decimal;
    stockQty: number;
    reservedQty: number;
  }>;
  seo: { slug: string } | null;
}): ProductListItem {
  const primaryVariant = product.variants[0];
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    slug: product.seo?.slug ?? null,
    primaryImage: primaryImage?.url ?? null,
    category: product.category,
    variant: primaryVariant
      ? {
          id: primaryVariant.id,
          sku: primaryVariant.sku,
          price: primaryVariant.price.toString(),
          mrp: primaryVariant.mrp.toString(),
          gstPercent: primaryVariant.gstPercent.toString(),
          stockQty: getAvailableQty(primaryVariant.stockQty, primaryVariant.reservedQty),
        }
      : null,
  };
}

export const productsService = {
  async list(query: ProductListQuery, isAdmin = false) {
    const { page, limit, search, categoryId, category, brand, minPrice, maxPrice, inStock, isActive, isFeatured, sort } = query;
    const skip = (page - 1) * limit;

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { slug: category, isActive: true },
        select: { id: true },
      });
      resolvedCategoryId = categoryRecord?.id;
    }

    // Only an authenticated admin can request inactive products via isActive=false
    const effectiveIsActive = isAdmin ? isActive : true;

    const where: Prisma.ProductWhereInput = {
      ...(effectiveIsActive !== undefined ? { isActive: effectiveIsActive } : {}),
      ...(resolvedCategoryId && { categoryId: resolvedCategoryId }),
      ...(brand && { brand: { equals: brand, mode: 'insensitive' } }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    if (minPrice !== undefined || maxPrice !== undefined || inStock !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          ...(minPrice !== undefined && { price: { gte: minPrice } }),
          ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
          ...(inStock === true && { stockQty: { gt: 0 } }),
          ...(inStock === false && { stockQty: { lte: 0 } }),
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { isActive: true },
            orderBy: { price: sort === 'price_asc' ? 'asc' : sort === 'price_desc' ? 'desc' : 'asc' },
            take: 1,
          },
          seo: { select: { slug: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const items = products.map(mapListItem);

    if (sort === 'price_asc') {
      items.sort((a, b) => parseFloat(a.variant?.price ?? '0') - parseFloat(b.variant?.price ?? '0'));
    } else if (sort === 'price_desc') {
      items.sort((a, b) => parseFloat(b.variant?.price ?? '0') - parseFloat(a.variant?.price ?? '0'));
    }

    return {
      items,
      meta: buildPaginationMeta(total, page, limit),
    };
  },
  async getByIdentifier(identifier: string, isAdmin = false) {
    const include = {
      ...productInclude,
      variants: {
        where: isAdmin ? {} : { isActive: true },
        orderBy: { createdAt: 'asc' as const },
      },
    };

    const product = await prisma.product.findUnique({ where: { id: identifier }, include });
    if (product) {
      if (!isAdmin && !product.isActive) {
        throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
      }
      return product; 
    }

    const slugProduct = await prisma.product.findFirst({
      where: { seo: { slug: identifier }, ...(isAdmin ? {} : { isActive: true }) },
      include,
    });

    if (!slugProduct) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }
    return slugProduct;
  },

  async getBySlug(slug: string, isAdmin = false) {
    return this.getByIdentifier(slug, isAdmin);
  },

  async getByCategorySlug(slug: string, query: ProductListQuery, isAdmin = false) {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category || !category.isActive) {
      throw new AppError('Category not found', 404, ErrorCodes.NOT_FOUND);
    }
  
    return this.list({ ...query, category: slug }, isAdmin);
  },

  async listBrands() {
    const brands = await prisma.product.findMany({
      where: { isActive: true },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });

    return brands.map((item) => item.brand);
  },

  async create(dto: CreateProductDto) {
    const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404, ErrorCodes.NOT_FOUND);
    }

    const baseSlug = generateSlug(dto.name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.productSeo.findUnique({ where: { slug: s } });
      return existing !== null;
    });

    const product = await prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        brand: dto.brand,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured,
        variants: {
          create: dto.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            price: toDecimal(v.price),
            mrp: toDecimal(v.mrp),
            gstPercent: toDecimal(v.gstPercent),
            hsnCode: v.hsnCode,
            stockQty: v.stockQty,
            lowStockThreshold: v.lowStockThreshold,
            supplierId: v.supplierId,
            attributes: v.attributes,
          })),
        },
        specifications: dto.specifications
          ? { create: dto.specifications }
          : undefined,
        seo: {
          create: {
            slug,
            metaTitle: dto.seo?.metaTitle ?? dto.name,
            metaDescription: dto.seo?.metaDescription ?? dto.description.slice(0, 160),
            focusKeyword: dto.seo?.focusKeyword ?? null,
            keywords: dto.seo?.keywords ?? [],
            ogTitle: dto.seo?.ogTitle ?? null,
            ogDescription: dto.seo?.ogDescription ?? null,
            ogImage: dto.seo?.ogImage ?? null,
          },
        },
      },
      include: productInclude,
    });

    return product;
  },

  async update(id: string, dto: UpdateProductDto) {
    const existing = await prisma.product.findUnique({ where: { id }, include: { seo: true } });
    if (!existing) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    const productData = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.brand !== undefined && { brand: dto.brand }),
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const seoSlug = dto.seo?.slug ?? existing.seo?.slug ?? generateSlug(existing.name);
    const finalSlug = await ensureUniqueSlug(seoSlug, async (s) => {
      const existingSeo = await prisma.productSeo.findUnique({ where: { slug: s } });
      return existingSeo !== null && existingSeo.productId !== id;
    });

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: productData,
      });

      if (dto.variants !== undefined) {
        const incomingIds = dto.variants
          .map((v) => v.id)
          .filter((id): id is string => Boolean(id));
      
        // Delete variants that were removed from the payload (not present by id)
        await tx.productVariant.deleteMany({
          where: {
            productId: updatedProduct.id,
            id: { notIn: incomingIds },
          },
        });
      
        for (const v of dto.variants) {
          const data = {
            sku: v.sku,
            name: v.name,
            price: toDecimal(v.price),
            mrp: toDecimal(v.mrp),
            gstPercent: toDecimal(v.gstPercent),
            hsnCode: v.hsnCode,
            stockQty: v.stockQty,
            lowStockThreshold: v.lowStockThreshold,
            supplierId: v.supplierId,
            attributes: v.attributes,
          };
        
          if (v.id) {
            // Scope the update to this product so one product's payload can't
            // silently touch another product's variant by guessing/reusing an id
            const result = await tx.productVariant.updateMany({
              where: { id: v.id, productId: updatedProduct.id },
              data,
            });
          
            if (result.count === 0) {
              throw new AppError(
                `Variant ${v.id} not found for this product`,
                404,
                ErrorCodes.NOT_FOUND
              );
            }
    } else {
      await tx.productVariant.create({
        data: { ...data, productId: updatedProduct.id },
      });
    }
  }
}

      if (dto.specifications !== undefined) {
        await tx.productSpec.deleteMany({ where: { productId: updatedProduct.id } });
        if (dto.specifications.length > 0) {
          await tx.productSpec.createMany({
            data: dto.specifications.map((spec) => ({
              productId: updatedProduct.id,
              key: spec.key,
              value: spec.value,
              sortOrder: spec.sortOrder,
            })),
          });
        }
      }

      if (dto.seo !== undefined) {
        const seoData = {
          metaTitle: dto.seo.metaTitle ?? null,
          metaDescription: dto.seo.metaDescription ?? null,
          slug: finalSlug,
          focusKeyword: dto.seo.focusKeyword ?? null,
          keywords: dto.seo.keywords ?? [],
          ogTitle: dto.seo.ogTitle ?? null,
          ogDescription: dto.seo.ogDescription ?? null,
          ogImage: dto.seo.ogImage ?? null,
        };

        if (existing.seo) {
          await tx.productSeo.update({ where: { productId: id }, data: seoData });
        } else {
          await tx.productSeo.create({ data: { productId: id, ...seoData } });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });

    return product;
  },

  async softDelete(id: string): Promise<void> {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async uploadImages(productId: string, files: Express.Multer.File[]) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }
  
    const existingCount = await prisma.productImage.count({ where: { productId } });
  
    const uploadResults = await Promise.all(
      files.map((file) =>
        new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'divye/products', resource_type: 'image' },
            (error, uploadResult) => {
              if (error || !uploadResult) reject(error ?? new Error('Upload failed'));
              else resolve(uploadResult);
            }
          );
          stream.end(file.buffer);
        })
      )
    );
  
    const uploaded = await prisma.productImage.createMany({
      data: uploadResults.map((result, i) => ({
        productId,
        url: result.secure_url,
        publicId: result.public_id,
        altText: product.name,
        sortOrder: existingCount + i,
        isPrimary: existingCount === 0 && i === 0,
      })),
    });
  
    // createMany doesn't return the created rows — refetch if the caller needs full image records
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      take: uploadResults.length,
      skip: existingCount,
    });
  },

  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
  
    if (!image) {
      throw new AppError('Image not found', 404, ErrorCodes.NOT_FOUND);
    }
  
    // Delete the DB row first — if this fails, we haven't destroyed anything real yet.
    // If Cloudinary delete fails after, we're left with an orphaned remote asset
    // instead of a broken image reference the storefront would actually render — the safer failure direction.
    await prisma.productImage.delete({ where: { id: imageId } });
  
    try {
      await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' });
    } catch (error) {
      // Log and swallow — don't fail the request over a Cloudinary-side cleanup issue.
      // Worth wiring to a proper logger/alerting so orphaned assets don't pile up silently.
      console.error(`Failed to delete Cloudinary asset ${image.publicId} for image ${imageId}:`, error);
    }
  },
};
