import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as carriersController from './carriers.controller';
import { createCarrierSchema } from './carriers.types';

const router = Router();

router.get('/', authenticate, carriersController.listActive); // any logged-in user needs this for "Track My Order"
router.get('/admin', authenticate, requireAdmin, carriersController.listAll);
router.post('/admin', authenticate, requireAdmin, validate(createCarrierSchema), carriersController.create);
router.delete('/admin/:id', authenticate, requireAdmin, carriersController.deactivate);

export default router;