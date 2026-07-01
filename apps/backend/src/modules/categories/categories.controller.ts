import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { categoriesService } from './categories.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './categories.types';

export const getTree = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await categoriesService.getTree();
    res.status(200).json(successResponse(result, 'Categories retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await categoriesService.getBySlug(req.params.slug);
    res.status(200).json(successResponse(result, 'Category retrieved'));
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request<Record<string, never>, unknown, CreateCategoryDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await categoriesService.create(req.body);
    res.status(201).json(successResponse(result, 'Category created'));
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request<{ id: string }, unknown, UpdateCategoryDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await categoriesService.update(req.params.id, req.body);
    res.status(200).json(successResponse(result, 'Category updated'));
  } catch (error) {
    next(error);
  }
};

export const deactivate = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await categoriesService.deactivate(req.params.id);
    res.status(200).json(successResponse(null, 'Category deactivated'));
  } catch (error) {
    next(error);
  }
};
