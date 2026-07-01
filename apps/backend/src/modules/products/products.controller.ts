import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { productsService } from './products.service';
import type { CreateProductDto, ProductListQuery, UpdateProductDto } from './products.types';

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.list(req.query as unknown as ProductListQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const listBrands = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.listBrands();
    res.status(200).json(successResponse(result, 'Brands retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getByIdentifier = async (
  req: Request<{ identifier: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.getByIdentifier(req.params.identifier);
    res.status(200).json(successResponse(result, 'Product retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getByCategorySlug = async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.getByCategorySlug(req.params.slug, req.query as unknown as ProductListQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request<Record<string, never>, unknown, CreateProductDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.create(req.body);
    res.status(201).json(successResponse(result, 'Product created successfully'));
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request<{ id: string }, unknown, UpdateProductDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await productsService.update(req.params.id, req.body);
    res.status(200).json(successResponse(result, 'Product updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const softDelete = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await productsService.softDelete(req.params.id);
    res.status(200).json(successResponse(null, 'Product deactivated'));
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
    if (!files?.length) {
      res.status(400).json({ success: false, error: 'No images provided', code: 'BAD_REQUEST', statusCode: 400 });
      return;
    }
    const result = await productsService.uploadImages(req.params.id, files);
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
    await productsService.removeImage(req.params.id, req.params.imageId);
    res.status(200).json(successResponse(null, 'Image removed'));
  } catch (error) {
    next(error);
  }
};
