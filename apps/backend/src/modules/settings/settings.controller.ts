import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { settingsService } from './settings.service';
import type { UpdateAppSettingsDto } from './settings.types';

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