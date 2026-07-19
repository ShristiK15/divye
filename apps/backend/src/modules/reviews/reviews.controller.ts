import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { reviewsService } from './reviews.service';
import type { CreateReviewDto, ReviewsQuery } from './reviews.types';
import { AppError, ErrorCodes } from '../../utils/app-error';

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

export const getPending = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await reviewsService.getPending(req.query as unknown as ReviewsQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const uploadImages = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new AppError('At least one image file is required', 400, ErrorCodes.BAD_REQUEST);
    }
    const result = await reviewsService.uploadImages(req.params.id, req.user!.id, files);
    res.status(201).json(successResponse(result, 'Images uploaded'));
  } catch (error) {
    next(error);
  }
};

export const removeImage = async (
  req: Request<{ id: string; imageId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await reviewsService.removeImage(req.params.id, req.params.imageId, req.user!.id, req.user!.isAdmin);
    res.status(200).json(successResponse(null, 'Image removed'));
  } catch (error) {
    next(error);
  }
};