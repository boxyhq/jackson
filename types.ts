export type ApiSuccess<T> = { data: T };

export interface ApiError extends Error {
  status: number;
}

export type ApiResponse<T = any> = ApiSuccess<T> | { error: ApiError };
