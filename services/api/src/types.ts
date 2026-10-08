/**
 * Configuration the API process is built from, resolved once at startup.
 *
 * Request and response shapes that cross the network live in
 * `@newzcrime/shared`; this file covers what the process itself needs.
 */

import type { Cache } from '@newzcrime/cache';
import type { Database } from '@newzcrime/db';
import type { Logger } from 'pino';

export interface ApiConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  /**
   * Allowed CORS origins.
   *
   * A non-empty list is used as the allow-list. An empty list blocks
   * cross-origin reads in production and reflects the caller in development,
   * where the Expo dev server is a different origin on the same machine.
   */
  corsOrigins: string[];
  /** Pooled Postgres connection — port 6543 on Supabase. */
  databaseUrl: string;
  /** TCP Redis endpoint, e.g. `redis://127.0.0.1:6379`. */
  redisUrl: string;
  logLevel: LogLevel;
  /** Requests per window per IP for the public API. */
  rateLimitMax: number;
  rateLimitWindowMs: number;
  /**
   * Proxy hops to trust when resolving the client IP.
   *
   * `false` when the API is reached directly, which is what local development
   * and a bare container are. Set to the hop count (often `1`) when a host or
   * Supabase sits in front, or rate limiting keys on the wrong address.
   */
  trustProxy: boolean | number;
}

/** What the read services need: data and cache. */
export interface ServiceDeps {
  db: Database;
  cache: Cache;
}

/** Everything `createApp` needs, resolved once at startup. */
export interface ApiDependencies extends ServiceDeps {
  config: ApiConfig;
  logger: Logger;
}

/** Log levels accepted by pino. */
export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';
