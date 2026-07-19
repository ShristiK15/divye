import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadMultiple } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as reviewsController from './reviews.controller';
import { createReviewSchema, reviewsQuerySchema } from './reviews.types';

const router = Router();

router.post('/products/:productId', authenticate, validate(createReviewSchema), reviewsController.create);
router.get('/products/:productId', validate(reviewsQuerySchema, 'query'), reviewsController.getByProduct);
router.get('/admin/pending', authenticate, requireAdmin, validate(reviewsQuerySchema, 'query'), reviewsController.getPending);
router.post('/:id/images', authenticate, uploadMultiple, reviewsController.uploadImages);
router.delete('/:id/images/:imageId', authenticate, reviewsController.removeImage);
router.put('/:id/approve', authenticate, requireAdmin, reviewsController.approve);
router.delete('/:id', authenticate, requireAdmin, reviewsController.remove);

export default router;
