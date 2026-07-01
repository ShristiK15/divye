import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { cartService } from './cart.service';
import type { AddCartItemDto, UpdateCartItemDto } from './cart.types';

export const getCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await cartService.getCart(req.user!.id);
    res.status(200).json(successResponse(result, 'Cart retrieved'));
  } catch (error) {
    next(error);
  }
};

export const addItem = async (
  req: Request<Record<string, never>, unknown, AddCartItemDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await cartService.addItem(req.user!.id, req.body);
    res.status(201).json(successResponse(result, 'Item added to cart'));
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (
  req: Request<{ id: string }, unknown, UpdateCartItemDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await cartService.updateItem(req.user!.id, req.params.id, req.body);
    res.status(200).json(successResponse(result, 'Cart item updated'));
  } catch (error) {
    next(error);
  }
};

export const removeItem = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await cartService.removeItem(req.user!.id, req.params.id);
    res.status(200).json(successResponse(null, 'Item removed from cart'));
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await cartService.clearCart(req.user!.id);
    res.status(200).json(successResponse(null, 'Cart cleared'));
  } catch (error) {
    next(error);
  }
};

export const validate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await cartService.validate(req.user!.id);
    res.status(200).json(successResponse(result, 'Cart validated'));
  } catch (error) {
    next(error);
  }
};
