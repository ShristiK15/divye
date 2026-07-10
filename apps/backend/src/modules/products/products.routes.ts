import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireAdmin } from '../../middleware/auth.middleware';
import { uploadMultiple } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as productsController from './products.controller';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from './products.types';

const router = Router();

router.get('/', optionalAuthenticate, validate(productListQuerySchema, 'query'), productsController.list);
router.get('/brands', productsController.listBrands);
router.get('/category/:slug', optionalAuthenticate, validate(productListQuerySchema, 'query'), productsController.getByCategorySlug);
router.get('/:identifier', optionalAuthenticate, productsController.getByIdentifier);
router.post('/', authenticate, requireAdmin, validate(createProductSchema), productsController.create);
router.put('/:id', authenticate, requireAdmin, validate(updateProductSchema), productsController.update);
router.delete('/:id', authenticate, requireAdmin, productsController.softDelete);
router.post('/:id/images', authenticate, requireAdmin, uploadMultiple, productsController.uploadImages);
router.delete('/:id/images/:imageId', authenticate, requireAdmin, productsController.removeImage);

export default router;
