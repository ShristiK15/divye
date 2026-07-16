import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import * as settingsController from './settings.controller';
import { updateAppSettingsSchema } from './settings.types';

// Mount at /api/admin/settings. Full settings row, admin-only, read/write.
export const adminSettingsRouter = Router();
adminSettingsRouter.get('/', authenticate, requireAdmin, settingsController.getSettings);
adminSettingsRouter.put(
  '/',
  authenticate,
  requireAdmin,
  validate(updateAppSettingsSchema),
  settingsController.updateSettings
);

// Mount at /api/settings. No auth — the storefront checkout page needs this
// before an order is placed (e.g. to show/hide the COD option and the
// free-shipping threshold), not just find out via a 400 from placeOrder.
// Read-only, and returns only the customer-relevant subset via
// settingsService.getPublicSettings().
export const publicSettingsRouter = Router();
publicSettingsRouter.get('/', settingsController.getPublicSettings);