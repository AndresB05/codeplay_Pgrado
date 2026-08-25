import type { AppError } from '../errors/AppError';

export interface SupabaseResponse<T> {
  data: T | null;
  error: AppError | null;
}

export interface PaginatedResponse<T> {
  count: number | null;
  data: T[];
  error: AppError | null;
}

export type ServiceResult<T> = Promise<SupabaseResponse<T>>;
