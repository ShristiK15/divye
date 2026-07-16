import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { carriersService } from './carriers.service';
import type { CreateCarrierDto } from './carriers.types';

export const listActive = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const carriers = await carriersService.listActive();
    res.status(200).json(successResponse(carriers, 'Carriers retrieved'));
  } catch (error) {
    next(error);
  }
};

export const listAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const carriers = await carriersService.listAll();
    res.status(200).json(successResponse(carriers, 'Carriers retrieved'));
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request<Record<string, never>, unknown, CreateCarrierDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const carrier = await carriersService.create(req.body);
    res.status(201).json(successResponse(carrier, 'Carrier added'));
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
    await carriersService.deactivate(req.params.id);
    res.status(200).json(successResponse(null, 'Carrier deactivated'));
  } catch (error) {
    next(error);
  }
};