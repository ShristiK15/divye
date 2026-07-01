import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { seoService } from './seo.service';
import type { UpsertSeoDto } from './seo.types';

export const getByProductId = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await seoService.getByProductId(req.params.id);
    res.status(200).json(successResponse(result, 'SEO data retrieved'));
  } catch (error) {
    next(error);
  }
};

export const upsert = async (
  req: Request<{ id: string }, unknown, UpsertSeoDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await seoService.upsert(req.params.id, req.body);
    res.status(200).json(successResponse(result, 'SEO data saved'));
  } catch (error) {
    next(error);
  }
};

export const sitemap = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const xml = await seoService.generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};
