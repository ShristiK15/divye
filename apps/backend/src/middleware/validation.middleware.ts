import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '../utils/app-error';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidationTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const validationError = new AppError(
          'Validation failed',
          422,
          ErrorCodes.VALIDATION_ERROR
        );
        (validationError as AppError & { details: unknown }).details = details;
        next(validationError);
        return;
      }
      next(error);
    }
  };
