export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  code: string;
  statusCode: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiPaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
};
