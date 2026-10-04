/**
 * Configuration the API process is built from, resolved once at startup.
 *
 * Request and response shapes that cross the network live in
 * `@newzcrime/shared`; this file covers what the process itself needs.
 */

export interface ApiConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  /** Allowed CORS origins. Empty means same-origin only. */
  corsOrigins: string[];
  /** Pooled Postgres connection — port 6543 on Supabase. */
  databaseUrl: string;
  /** TCP Redis endpoint, e.g. `redis://127.0.0.1:6379`. */
  redisUrl: string;
  logLevel: LogLevel;
  /** Requests per window per IP for the public API. */
  rateLimitMax: number;
  rateLimitWindowMs: number;
}

/** Log levels accepted by pino. */
export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';
