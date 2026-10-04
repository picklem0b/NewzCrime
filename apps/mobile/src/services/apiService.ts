/**
 * The single API client instance.
 *
 * `EXPO_PUBLIC_API_URL` is inlined at build time by Expo, so this is the only
 * place the base URL is read.
 */

import { createApiClient } from '@newzcrime/shared';
import type { ApiClient } from '@newzcrime/shared';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4000';

export const apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL
).replace(/\/+$/, '');

export const apiClient: ApiClient = createApiClient({ baseUrl: apiBaseUrl });
