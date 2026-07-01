import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadCsv } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as inventoryController from './inventory.controller';
import {
  adjustStockSchema,
  inventoryListQuerySchema,
  restockSchema,
} from './inventory.types';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', validate(inventoryListQuerySchema, 'query'), inventoryController.list);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/variant/:variantId/logs', inventoryController.getLogs);
router.post('/variant/:variantId/adjust', validate(adjustStockSchema), inventoryController.adjust);
router.post('/variant/:variantId/restock', validate(restockSchema), inventoryController.restock);
router.post('/bulk-update', uploadCsv, inventoryController.bulkUpdate);

export default router;
