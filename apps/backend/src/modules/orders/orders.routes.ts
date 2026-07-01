import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as ordersController from './orders.controller';
import {
  adminOrdersQuerySchema,
  placeOrderSchema,
  updateOrderStatusSchema,
  userOrdersQuerySchema,
} from './orders.types';

const router = Router();

router.post('/', authenticate, validate(placeOrderSchema), ordersController.placeOrder);
router.get('/', authenticate, validate(userOrdersQuerySchema, 'query'), ordersController.getUserOrders);
router.get('/admin', authenticate, requireAdmin, validate(adminOrdersQuerySchema, 'query'), ordersController.getAdminOrders);
router.put('/admin/:id/status', authenticate, requireAdmin, validate(updateOrderStatusSchema), ordersController.updateStatus);
router.get('/:orderNumber', authenticate, ordersController.getByOrderNumber);
router.post('/:id/cancel', authenticate, ordersController.cancelOrder);
router.post('/:id/return', authenticate, ordersController.requestReturn);

export default router;
