export type ApiSuccess<T> = { data: T; pageToken?: string };

export interface ApiError extends Error {
  info?: string;
  status: number;
}
