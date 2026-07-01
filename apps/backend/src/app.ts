import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import seoRoutes from './modules/seo/seo.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import cartRoutes from './modules/cart/cart.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import * as seoController from './modules/seo/seo.controller';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  app.use(requestLogger);

  app.use(
    '/api/payments/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    (req, _res, next) => {
      (req as express.Request & { rawBody?: string }).rawBody = req.body.toString();
      try {
        req.body = JSON.parse(req.body.toString());
      } catch {
        req.body = {};
      }
      next();
    }
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  app.get('/sitemap.xml', seoController.sitemap);

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/products/:id/seo', seoRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/admin/analytics', analyticsRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  app.use(errorMiddleware);

  return app;
}
