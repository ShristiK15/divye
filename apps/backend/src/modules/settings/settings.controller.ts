import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { AppError, ErrorCodes } from '../../utils/app-error';
import { settingsService } from './settings.service';
import { homepageService } from './homepage.service';
import type { UpdateAppSettingsDto } from './settings.types';
import type { ReorderHeroImagesDto, UpdateHeroImageAltDto } from './homepage.types';

export const getSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json(successResponse(settings, 'Settings retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getPublicSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.getPublicSettings();
    res.status(200).json(successResponse(settings, 'Settings retrieved'));
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: Request<Record<string, never>, unknown, UpdateAppSettingsDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.status(200).json(successResponse(settings, 'Settings updated'));
  } catch (error) {
    next(error);
  }
};

// --- Homepage: hero images ------------------------------------------------

export const uploadHeroImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) {
      throw new AppError('No image files were provided', 400, ErrorCodes.BAD_REQUEST);
    }
    const heroImages = await homepageService.heroImages.add(files);
    res.status(201).json(successResponse({ heroImages }, 'Hero images uploaded'));
  } catch (error) {
    next(error);
  }
};

export const deleteHeroImage = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const heroImages = await homepageService.heroImages.remove(req.params.id);
    res.status(200).json(successResponse({ heroImages }, 'Hero image removed'));
  } catch (error) {
    next(error);
  }
};

export const reorderHeroImages = async (
  req: Request<Record<string, never>, unknown, ReorderHeroImagesDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const heroImages = await homepageService.heroImages.reorder(req.body.order);
    res.status(200).json(successResponse({ heroImages }, 'Hero images reordered'));
  } catch (error) {
    next(error);
  }
};

export const updateHeroImageAlt = async (
  req: Request<{ id: string }, unknown, UpdateHeroImageAltDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const heroImages = await homepageService.heroImages.updateAlt(req.params.id, req.body.altText);
    res.status(200).json(successResponse({ heroImages }, 'Hero image updated'));
  } catch (error) {
    next(error);
  }
};