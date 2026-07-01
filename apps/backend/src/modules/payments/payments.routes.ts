import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as paymentsController from './payments.controller';
import {
  codConfirmSchema,
  razorpayCreateOrderSchema,
  razorpayVerifySchema,
} from './payments.types';

const router = Router();

router.post('/razorpay/create-order', authenticate, validate(razorpayCreateOrderSchema), paymentsController.createRazorpayOrder);
router.post('/razorpay/verify', authenticate, validate(razorpayVerifySchema), paymentsController.verifyRazorpayPayment);
router.post('/razorpay/webhook', paymentsController.webhook);
router.post('/cod/confirm', authenticate, validate(codConfirmSchema), paymentsController.confirmCod);
router.post('/refund/:orderId', authenticate, requireAdmin, paymentsController.initiateRefund);

export default router;
