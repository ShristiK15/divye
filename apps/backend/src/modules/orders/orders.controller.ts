import type { Request, Response, NextFunction } from 'express';
import { paginatedResponse, successResponse } from '../../utils/response';
import { ordersService } from './orders.service';
import type {
  AdminOrdersQuery,
  PlaceOrderDto,
  UpdateOrderStatusDto,
  UserOrdersQuery,
} from './orders.types';

export const placeOrder = async (
  req: Request<Record<string, never>, unknown, PlaceOrderDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ordersService.placeOrder(req.user!.id, req.body);
    res.status(201).json(successResponse(result, 'Order placed successfully'));
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ordersService.getUserOrders(req.user!.id, req.query as unknown as UserOrdersQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const getByOrderNumber = async (
  req: Request<{ orderNumber: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ordersService.getByOrderNumber(
      req.params.orderNumber,
      req.user!.id
    );
    res.status(200).json(successResponse(result, 'Order retrieved'));
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ordersService.cancelOrder(req.params.id, req.user!.id);
    res.status(200).json(successResponse(null, 'Order cancelled'));
  } catch (error) {
    next(error);
  }
};

export const requestReturn = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ordersService.requestReturn(req.params.id, req.user!.id);
    res.status(200).json(successResponse(null, 'Return requested'));
  } catch (error) {
    next(error);
  }
};

export const getAdminOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ordersService.getAdminOrders(req.query as unknown as AdminOrdersQuery);
    res.status(200).json(paginatedResponse(result.items, result.meta));
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (
  req: Request<{ id: string }, unknown, UpdateOrderStatusDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ordersService.updateStatus(req.params.id, req.body);
    res.status(200).json(successResponse(null, 'Order status updated'));
  } catch (error) {
    next(error);
  }
};
