export type ApiSuccess<T> = { data: T };

export interface ApiError extends Error {
  status: number;
}

export type ApiResponse<T> = ApiSuccess<T> & { error: { message: string } };
