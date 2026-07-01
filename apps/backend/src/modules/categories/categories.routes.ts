import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as categoriesController from './categories.controller';
import { createCategorySchema, updateCategorySchema } from './categories.types';

const router = Router();

router.get('/', categoriesController.getTree);
router.get('/:slug', categoriesController.getBySlug);
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), categoriesController.create);
router.put('/:id', authenticate, requireAdmin, validate(updateCategorySchema), categoriesController.update);
router.delete('/:id', authenticate, requireAdmin, categoriesController.deactivate);

export default router;
