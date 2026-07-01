import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { inventoryService } from './inventory.service';
import type { AdjustStockDto, InventoryListQuery, RestockDto } from './inventory.types';

export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await inventoryService.list(req.query as unknown as InventoryListQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await inventoryService.getLowStock();
    res.status(200).json(successResponse(result, 'Low stock items retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (
  req: Request<{ variantId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await inventoryService.getLogs(req.params.variantId);
    res.status(200).json(successResponse(result, 'Inventory logs retrieved'));
  } catch (error) {
    next(error);
  }
};

export const adjust = async (
  req: Request<{ variantId: string }, unknown, AdjustStockDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await inventoryService.adjust(req.params.variantId, req.body, req.user!.id);
    res.status(200).json(successResponse(null, 'Stock adjusted'));
  } catch (error) {
    next(error);
  }
};

export const restock = async (
  req: Request<{ variantId: string }, unknown, RestockDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await inventoryService.restock(req.params.variantId, req.body, req.user!.id);
    res.status(200).json(successResponse(null, 'Stock restocked'));
  } catch (error) {
    next(error);
  }
};

export const bulkUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'CSV file required', code: 'BAD_REQUEST', statusCode: 400 });
      return;
    }
    const result = await inventoryService.bulkUpdate(file.buffer.toString('utf-8'), req.user!.id);
    res.status(200).json(successResponse(result, 'Bulk update completed'));
  } catch (error) {
    next(error);
  }
};
