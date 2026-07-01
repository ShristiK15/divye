import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { reviewsService } from './reviews.service';
import type { CreateReviewDto, ReviewsQuery } from './reviews.types';

export const create = async (
  req: Request<{ productId: string }, unknown, CreateReviewDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reviewsService.create(req.user!.id, req.params.productId, req.body);
    res.status(201).json(successResponse(result, 'Review submitted for approval'));
  } catch (error) {
    next(error);
  }
};

export const getByProduct = async (
  req: Request<{ productId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reviewsService.getByProduct(req.params.productId, req.query as unknown as ReviewsQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const approve = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reviewsService.approve(req.params.id);
    res.status(200).json(successResponse(result, 'Review approved'));
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await reviewsService.delete(req.params.id);
    res.status(200).json(successResponse(null, 'Review deleted'));
  } catch (error) {
    next(error);
  }
};
