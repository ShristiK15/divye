import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as wishlistController from './wishlist.controller';
import { wishlistQuerySchema, moveToCartSchema } from './wishlist.types';

const router = Router();

router.get('/', authenticate, validate(wishlistQuerySchema, 'query'), wishlistController.list);
router.post('/:productId', authenticate, wishlistController.add);
router.delete('/:productId', authenticate, wishlistController.remove);
router.post('/:productId/toggle', authenticate, wishlistController.toggle);
router.post(
    '/:productId/move-to-cart',
    authenticate,
    validate(moveToCartSchema, 'body'),
    wishlistController.moveToCart
);

export default router;