import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as analyticsController from './analytics.controller';
import { acquisitionQuerySchema, productSalesQuerySchema } from './analytics.types';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/overview', analyticsController.overview);
router.get('/revenue/monthly', analyticsController.monthlyRevenue);
router.get('/customers/acquisition', validate(acquisitionQuerySchema, 'query'), analyticsController.customerAcquisition);
router.get('/customers/retention', analyticsController.customerRetention);
router.get('/products/top', analyticsController.topProducts);
router.get('/products/:id/sales', validate(productSalesQuerySchema, 'query'), analyticsController.productSales);
router.get('/orders/recent', analyticsController.recentOrders);

export default router;
