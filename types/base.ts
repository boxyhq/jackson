export type ApiSuccess<T> = { data: T; pageToken?: string };

export interface ApiError extends Error {
  info?: string;
  status: number;
}

export type ApiResponse<T = any> = ApiSuccess<T> | { error: ApiError };

export type PaginateApiParams = { pageOffset: number; pageLimit: number } & { pageToken?: string };
