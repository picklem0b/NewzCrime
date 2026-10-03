/**
 * Reads worker configuration from the environment.
 *
 * Note which URL it reads: `DATABASE_URL_DIRECT`, not the pooled one. pg-boss
 * depends on session-level Postgres features that the Supabase transaction
 * pooler does not provide. See `docs/ARCHITECTURE.md`.
 */

import type { WorkerConfig } from '../types';

const DEFAULT_INGEST_CRON = '*/15 * * * *';

export function loadWorkerConfig(
  env: NodeJS.ProcessEnv = process.env
): WorkerConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    databaseUrl: env.DATABASE_URL_DIRECT ?? env.DATABASE_URL ?? '',
    redisRestUrl: env.UPSTASH_REDIS_REST_URL ?? '',
    redisRestToken: env.UPSTASH_REDIS_REST_TOKEN ?? '',
    ingestCron: env.INGEST_CRON ?? DEFAULT_INGEST_CRON,
    logLevel: env.LOG_LEVEL ?? 'info',
  };
}
