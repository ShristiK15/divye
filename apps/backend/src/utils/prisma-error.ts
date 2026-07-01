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
