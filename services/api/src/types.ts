/**
 * API service contracts.
 *
 * Describes the configuration the app is built from. Request/response shapes
 * that cross the network live in `@newzcrime/shared`, not here — this file is
 * for things the process itself needs.
 */

/** Everything `createApp` needs, resolved once at startup. */
export interface ApiConfig {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  /** Pooled Postgres URL — port 6543 on Supabase. */
  databaseUrl: string;
  /** Upstash REST endpoint; empty when caching is disabled locally. */
  redisRestUrl: string;
  redisRestToken: string;
}
