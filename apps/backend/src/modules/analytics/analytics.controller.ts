import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { analyticsService } from './analytics.service';
import type { AcquisitionQuery, ProductSalesQuery } from './analytics.types';

export const overview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getOverview();
    res.status(200).json(successResponse(result, 'Analytics overview retrieved'));
  } catch (error) {
    next(error);
  }
};

export const monthlyRevenue = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getMonthlyRevenue();
    res.status(200).json(successResponse(result, 'Monthly revenue retrieved'));
  } catch (error) {
    next(error);
  }
};

export const customerAcquisition = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getCustomerAcquisition(req.query as unknown as AcquisitionQuery);
    res.status(200).json(successResponse(result, 'Customer acquisition data retrieved'));
  } catch (error) {
    next(error);
  }
};

export const customerRetention = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getCustomerRetention();
    res.status(200).json(successResponse(result, 'Customer retention data retrieved'));
  } catch (error) {
    next(error);
  }
};

export const topProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getTopProducts();
    res.status(200).json(successResponse(result, 'Top products retrieved'));
  } catch (error) {
    next(error);
  }
};

export const productSales = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getProductSales(req.params.id, req.query as unknown as ProductSalesQuery);
    res.status(200).json(successResponse(result, 'Product sales data retrieved'));
  } catch (error) {
    next(error);
  }
};

export const recentOrders = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await analyticsService.getRecentOrders();
    res.status(200).json(successResponse(result, 'Recent orders retrieved'));
  } catch (error) {
    next(error);
  }
};
