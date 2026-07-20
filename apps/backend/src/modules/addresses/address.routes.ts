import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as addressController from './address.controller';
import { createAddressSchema, updateAddressSchema } from './address.types';

const router = Router();

router.get('/', authenticate, addressController.listAddressesHandler);
router.post('/', authenticate, validate(createAddressSchema), addressController.createAddressHandler);
router.get('/:id', authenticate, addressController.getAddressHandler);
router.patch('/:id', authenticate, validate(updateAddressSchema), addressController.updateAddressHandler);
router.delete('/:id', authenticate, addressController.deleteAddressHandler);
router.patch('/:id/default', authenticate, addressController.setDefaultAddressHandler);

export default router;