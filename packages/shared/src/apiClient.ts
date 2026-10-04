/**
 * API client shared by the mobile app and any future web client.
 *
 * Built on `fetch`, which exists in Node 20+ and React Native, so the package
 * stays dependency-free. Query strings are assembled by hand rather than with
 * `URL`, because React Native's `URL` implementation is incomplete.
 */

import type { ApiErrorBody } from './types';

/** Values accepted as query-string parameters. */
export type QueryValue = string | number | boolean | undefined | null;

export interface ApiClientOptions {
  /** e.g. `process.env.EXPO_PUBLIC_API_URL`. */
  baseUrl: string;
  /** Resolves the current auth token, or `null` when signed out. */
  getToken?: () => Promise<string | null>;
  /** Retries a failed idempotent `GET` once. Defaults to true. */
  retryOnNetworkError?: boolean;
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

const encodeQuery = (query?: Record<string, QueryValue>): string => {
  if (!query) return '';

  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

const parseBody = (text: string): unknown => {
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const isApiErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { error?: unknown }).error === 'string';

/** A network-level failure, as opposed to an HTTP status. */
const isNetworkError = (error: unknown): boolean =>
  error instanceof TypeError;

export function createApiClient(options: ApiClientOptions): ApiClient {
  const base = options.baseUrl.replace(/\/+$/, '');
  const retryOnNetworkError = options.retryOnNetworkError ?? true;

  const send = async (
    method: 'GET' | 'POST',
    path: string,
    request: RequestOptions & { body?: unknown }
  ): Promise<Response> => {
    const headers: Record<string, string> = { accept: 'application/json' };

    if (request.body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    const token = options.getToken ? await options.getToken() : null;
    if (token) headers.authorization = `Bearer ${token}`;

    const url = `${base}${path.startsWith('/') ? path : `/${path}`}${encodeQuery(request.query)}`;

    const attempt = (): Promise<Response> =>
      fetch(url, {
        method,
        headers,
        signal: request.signal,
        body:
          request.body === undefined ? undefined : JSON.stringify(request.body),
      });

    try {
      return await attempt();
    } catch (error) {
      // A dropped connection is worth one retry for a read; nothing else is.
      if (method === 'GET' && retryOnNetworkError && isNetworkError(error)) {
        return attempt();
      }
      throw error;
    }
  };

  const request = async <TResponse>(
    method: 'GET' | 'POST',
    path: string,
    requestOptions: RequestOptions & { body?: unknown }
  ): Promise<TResponse> => {
    const response = await send(method, path, requestOptions);
    const text = await response.text();
    const data = parseBody(text);

    if (!response.ok) {
      throw new ApiError(response.status, isApiErrorBody(data) ? data : null);
    }

    return data as TResponse;
  };

  return {
    get: (path, requestOptions) => request('GET', path, requestOptions ?? {}),

    post: (path, body, requestOptions) =>
      request('POST', path, { ...requestOptions, body }),
  };
}
