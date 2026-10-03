/**
 * API client contract shared by the mobile app and any future web client. The
 * interface and `ApiError` type are what consumers depend on.
 */

import type { ApiErrorBody } from './types';

/** Values accepted as query-string parameters. */
export type QueryValue = string | number | boolean | undefined | null;

export interface ApiClientOptions {
  /** e.g. `process.env.EXPO_PUBLIC_API_URL`. */
  baseUrl: string;
  /** Resolves the current auth token, or `null` when signed out. */
  getToken?: () => Promise<string | null>;
}

export interface RequestOptions {
  signal?: AbortSignal;
  query?: Record<string, QueryValue>;
}

export interface ApiClient {
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
  post<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    options?: RequestOptions
  ): Promise<TResponse>;
}

/** Normalised failure surfaced by every client method. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? body?.error ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Build a client bound to one base URL.
 *
 * TODO: request handling, auth header, JSON parsing, retry for idempotent GETs
 * and `AbortSignal` propagation.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  void options;
  throw new Error('createApiClient is not implemented yet');
}
