import { OrderStatus, prisma } from '@divye/database';
import { cloudinary } from '../../config/cloudinary';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { buildPaginationMeta } from '../../utils/response';
import { mapPrismaError } from '../../utils/prisma-error';
import type { CreateReviewDto, ReviewsQuery } from './reviews.types';


const MAX_REVIEW_IMAGES = 5;

export const reviewsService = {
  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product?.isActive) {
      throw new AppError('Product not found', 404, ErrorCodes.NOT_FOUND);
    }

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      throw new AppError('You have already reviewed this product', 409, ErrorCodes.CONFLICT);
    }

    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        items: { some: { variant: { productId } } },
      },
    });

    try {
      return await prisma.review.create({
        data: {
          userId,
          productId,
          rating: dto.rating,
          title: dto.title,
          body: dto.body,
          isVerified: deliveredOrder !== null,
          isApproved: false,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });
    } catch (error) {
      // Covers the race window between the pre-check above and this write —
      // two concurrent submits from the same user both pass the findUnique
      // check, second one hits the userId_productId unique constraint (P2002).
      throw mapPrismaError(error);
    }
  },

  async getByProduct(productId: string, query: ReviewsQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    return { items: reviews, meta: buildPaginationMeta(total, page, limit) };
  },

  async getPending(query: ReviewsQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { isApproved: false },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);

    return { items: reviews, meta: buildPaginationMeta(total, page, limit) };
  },

  async approve(reviewId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const updated = await tx.review.update({
          where: { id: reviewId },
          data: { isApproved: true },
        });

        // Lock the Product row so a concurrent approve/delete on another
        // review of the same product can't read a stale count before this
        // transaction commits — same race class as cart's stock reservation.
        await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${updated.productId} FOR UPDATE`;


        const agg = await tx.review.aggregate({
          where: { productId: updated.productId, isApproved: true },
          _avg: { rating: true },
          _count: true,
        });

        await tx.product.update({
          where: { id: updated.productId },
          data: {
            avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
            reviewCount: agg._count,
          },
        });

        return updated;
      });
    } catch (error) {
      throw mapPrismaError(error);
    }
  },

async delete(reviewId: string): Promise<void> {
     try {
      await prisma.$transaction(async (tx) => {
        const deleted = await tx.review.delete({ where: { id: reviewId } });

        const agg = await tx.review.aggregate({
          where: { productId: deleted.productId, isApproved: true },
          _avg: { rating: true },
          _count: true,
        });

        await tx.product.update({
          where: { id: deleted.productId },
          data: {
            avgRating: agg._avg.rating ?? 0,
            reviewCount: agg._count,
          },
        });
      });
     } catch (error) {
       throw mapPrismaError(error);
     }
   },

  async uploadImages(reviewId: string, userId: string, files: Express.Multer.File[]) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError('Review not found', 404, ErrorCodes.NOT_FOUND);
    }
    if (review.userId !== userId) {
      throw new AppError('You can only add images to your own review', 403, ErrorCodes.FORBIDDEN);
    }

    const existingCount = await prisma.reviewImage.count({ where: { reviewId } });
    if (existingCount + files.length > MAX_REVIEW_IMAGES) {
      throw new AppError(
        `A review can have at most ${MAX_REVIEW_IMAGES} images (${existingCount} already uploaded)`,
        400,
        ErrorCodes.BAD_REQUEST
      );
    }

    const uploadResults = await Promise.all(
      files.map((file) =>
        new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'divye/reviews', resource_type: 'image' },
            (error, uploadResult) => {
              if (error || !uploadResult) reject(error ?? new Error('Upload failed'));
              else resolve(uploadResult);
            }
          );
          stream.end(file.buffer);
        })
      )
    );

    await prisma.reviewImage.createMany({
      data: uploadResults.map((result, i) => ({
        reviewId,
        url: result.secure_url,
        publicId: result.public_id,
        sortOrder: existingCount + i,
      })),
    });

    // createMany doesn't return the created rows — refetch if the caller needs full image records
    return prisma.reviewImage.findMany({
      where: { reviewId },
      orderBy: { sortOrder: 'asc' },
      take: uploadResults.length,
      skip: existingCount,
    });
  },

  async removeImage(reviewId: string, imageId: string, userId: string, isAdmin: boolean): Promise<void> {
    const image = await prisma.reviewImage.findFirst({
      where: { id: imageId, reviewId },
      include: { review: { select: { userId: true } } },
    });

    if (!image) {
      throw new AppError('Image not found', 404, ErrorCodes.NOT_FOUND);
    }
    if (image.review.userId !== userId && !isAdmin) {
      throw new AppError('You can only remove images from your own review', 403, ErrorCodes.FORBIDDEN);
    }

    // Delete the DB row first — same reasoning as products: an orphaned Cloudinary
    // asset is a safer failure than a broken image reference the storefront renders.
    await prisma.reviewImage.delete({ where: { id: imageId } });

    try {
      await cloudinary.uploader.destroy(image.publicId, { resource_type: 'image' });
    } catch (error) {
      console.error(`Failed to delete Cloudinary asset ${image.publicId} for review image ${imageId}:`, error);
    }
  },
 };

