import { OrderStatus, prisma } from '@divye/database';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { buildPaginationMeta } from '../../utils/response';
import type { CreateReviewDto, ReviewsQuery } from './reviews.types';

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

    const review = await prisma.review.create({
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

    return review;
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

  async approve(reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError('Review not found', 404, ErrorCodes.NOT_FOUND);
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });
  },

  async delete(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError('Review not found', 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.review.delete({ where: { id: reviewId } });
  },
};
