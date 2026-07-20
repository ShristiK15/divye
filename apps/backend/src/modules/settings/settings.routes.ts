import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadMultiple } from '../../middleware/upload.middleware';
import * as settingsController from './settings.controller';
import { updateAppSettingsSchema } from './settings.types';
import { heroImageOrderSchema, updateHeroImageAltSchema } from './homepage.types';
import { updateContactDetailsSchema } from './contact.types';

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

// Hero section images (homepage). Admin-only — uploads go straight to
// Cloudinary via homepage.service.ts (heroImages namespace); nothing is
// written to local disk. `uploadMultiple` expects the files under the
// "images" field name and caps a single request at 10 files (see
// upload.middleware.ts). Routes are grouped under /homepage/... so later
// sections (banners, featured categories) can sit alongside cleanly.
adminSettingsRouter.post(
  '/homepage/hero-images',
  authenticate,
  requireAdmin,
  uploadMultiple,
  settingsController.uploadHeroImages
);
adminSettingsRouter.delete(
  '/homepage/hero-images/:id',
  authenticate,
  requireAdmin,
  settingsController.deleteHeroImage
);
adminSettingsRouter.put(
  '/homepage/hero-images/order',
  authenticate,
  requireAdmin,
  validate(heroImageOrderSchema),
  settingsController.reorderHeroImages
);
adminSettingsRouter.patch(
  '/homepage/hero-images/:id',
  authenticate,
  requireAdmin,
  validate(updateHeroImageAltSchema),
  settingsController.updateHeroImageAlt
);
adminSettingsRouter.put(
  '/contact',
  authenticate,
  requireAdmin,
  validate(updateContactDetailsSchema),
  settingsController.updateContactDetails
);
// Mount at /api/settings. No auth — the storefront checkout page needs this
// before an order is placed (e.g. to show/hide the COD option and the
// free-shipping threshold), and the homepage needs it to render the hero
// carousel — not just find out via a 400 from placeOrder.
// Read-only, and returns only the customer-relevant subset via
// settingsService.getPublicSettings().
export const publicSettingsRouter = Router();
publicSettingsRouter.get('/', settingsController.getPublicSettings);