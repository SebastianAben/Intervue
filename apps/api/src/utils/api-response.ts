import type { ApiErrorCode, ApiResponse } from '@intervue/shared';

export function ok<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
  };
}

export function fail(code: ApiErrorCode, message: string): ApiResponse<never> {
  return {
    data: null,
    error: {
      code,
      message,
    },
  };
}
