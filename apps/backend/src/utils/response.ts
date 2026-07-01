import type { ApiErrorResponse, ApiPaginatedResponse, ApiSuccessResponse, PaginationMeta } from '@divye/shared';

export function successResponse<T>(data: T, message = 'Success'): ApiSuccessResponse<T> {
  return { success: true, data, message };
}

export function errorResponse(
  error: string,
  code: string,
  statusCode: number
): ApiErrorResponse {
  return { success: false, error, code, statusCode };
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta
): ApiPaginatedResponse<T> {
  return { success: true, data, meta };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
