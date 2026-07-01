import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as reviewsController from './reviews.controller';
import { createReviewSchema, reviewsQuerySchema } from './reviews.types';

const router = Router();

router.post('/products/:productId', authenticate, validate(createReviewSchema), reviewsController.create);
router.get('/products/:productId', validate(reviewsQuerySchema, 'query'), reviewsController.getByProduct);
router.put('/:id/approve', authenticate, requireAdmin, reviewsController.approve);
router.delete('/:id', authenticate, requireAdmin, reviewsController.remove);

export default router;
