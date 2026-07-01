import type { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../utils/response';
import { paymentsService } from './payments.service';
import type { CodConfirmDto, RazorpayCreateOrderDto, RazorpayVerifyDto } from './payments.types';

export const createRazorpayOrder = async (
  req: Request<Record<string, never>, unknown, RazorpayCreateOrderDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await paymentsService.createRazorpayOrder(req.body, req.user!.id);
    res.status(200).json(successResponse(result, 'Razorpay order created'));
  } catch (error) {
    next(error);
  }
};

export const verifyRazorpayPayment = async (
  req: Request<Record<string, never>, unknown, RazorpayVerifyDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await paymentsService.verifyRazorpayPayment(req.body, req.user!.id);
    res.status(200).json(successResponse(result, 'Payment verified'));
  } catch (error) {
    next(error);
  }
};

export const webhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
    await paymentsService.handleWebhook(rawBody, signature);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const confirmCod = async (
  req: Request<Record<string, never>, unknown, CodConfirmDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await paymentsService.confirmCod(req.body, req.user!.id);
    res.status(200).json(successResponse(result, 'COD order confirmed'));
  } catch (error) {
    next(error);
  }
};

export const initiateRefund = async (
  req: Request<{ orderId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await paymentsService.initiateRefund(req.params.orderId);
    res.status(200).json(successResponse(result, 'Refund initiated'));
  } catch (error) {
    next(error);
  }
};
