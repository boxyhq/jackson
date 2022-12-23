export type ApiSuccess<T> = { data: T };

export interface ApiError extends Error {
  info?: string;
  status: number;
}

export type ApiResponse<T = any> = ApiSuccess<T> | { error: ApiError };
