/**
 * `@newzcrime/shared` — domain types, constants and the API client.
 *
 * Dependency-free so it stays cheap to bundle. Values are re-exported
 * normally; types use `export type`, as `verbatimModuleSyntax` requires.
 */

export * from './constants';
export * from './types';

export { ApiError, createApiClient } from './apiClient';
export type {
  ApiClient,
  ApiClientOptions,
  QueryValue,
  RequestOptions,
} from './apiClient';
