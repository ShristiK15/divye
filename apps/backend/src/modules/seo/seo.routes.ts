import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as seoController from './seo.controller';
import { upsertSeoSchema } from './seo.types';

const router = Router({ mergeParams: true });

router.get('/', seoController.getByProductId);
router.put('/', authenticate, requireAdmin, validate(upsertSeoSchema), seoController.upsert);

export default router;
