import { Prisma } from '@divye/database';
import { AppError, ErrorCodes } from './app-error';

export function mapPrismaError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return new AppError(
          `A record with this ${target} already exists`,
          409,
          ErrorCodes.CONFLICT
        );
      }
      case 'P2025':
        return new AppError('Record not found', 404, ErrorCodes.NOT_FOUND);
      case 'P2003':
        return new AppError('Related record not found', 400, ErrorCodes.BAD_REQUEST);
      case 'P2028':
        // Transaction API error — most commonly a lock-wait/transaction
        // timeout under concurrent load (e.g. multiple requests racing
        // on the same FOR UPDATE-locked row in cart addItem/updateItem).
        // Transient by nature, so 409 + a retry-worthy message rather
        // than a 500.
        return new AppError(
          'This action could not be completed due to high demand, please try again',
          409,
          ErrorCodes.CONFLICT
        );
      default:
        return new AppError('Database operation failed', 500, ErrorCodes.INTERNAL_ERROR);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError('Invalid data provided', 400, ErrorCodes.BAD_REQUEST);
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError('An unexpected error occurred', 500, ErrorCodes.INTERNAL_ERROR, false);
}
