import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@divye/database';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { mapPrismaError } from '../utils/prisma-error';
import { logger } from '../utils/logger';
import { errorResponse } from '../utils/response';

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    appError = mapPrismaError(err);
  } else {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    appError = new AppError('Internal server error', 500, 'INTERNAL_ERROR', false);
  }

  if (!appError.isOperational) {
    logger.error('Non-operational error', { message: appError.message });
  }

  const response = errorResponse(appError.message, appError.code, appError.statusCode);

  const details = (appError as AppError & { details?: unknown }).details;
  if (details) {
    Object.assign(response, { details });
  }

  if (env.NODE_ENV === 'development' && !appError.isOperational) {
    Object.assign(response, { stack: err.stack });
  }

  res.status(appError.statusCode).json(response);
};
