/**
 * Reads and validates worker configuration from the environment.
 *
 * Note which URL it reads: `DATABASE_URL_DIRECT`, not the pooled one. pg-boss
 * depends on session-level Postgres features that the Supabase transaction
 * pooler does not provide. See `docs/ARCHITECTURE.md`.
 */

import { z } from 'zod';

import type { LogLevel, WorkerConfig } from '../types';

const logLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
] as const satisfies ReadonlyArray<LogLevel>;

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL_DIRECT: z.string().min(1, 'is required'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  INGEST_CRON: z.string().min(1).default('*/15 * * * *'),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  WORKER_USER_AGENT: z
    .string()
    .default('NewzCrimeBot/1.0 (+https://newzcrime.app)'),
  WORKER_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  PODCAST_INDEX_API_KEY: z.string().default(''),
  PODCAST_INDEX_API_SECRET: z.string().default(''),
  WORKER_INGEST_ON_START: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

/** Render zod issues as one indented line each, for the startup log. */
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join('.') || '(root)';
      return `  - ${name} ${issue.message}`;
    })
    .join('\n');
}

export function loadWorkerConfig(
  env: NodeJS.ProcessEnv = process.env
): WorkerConfig {
  const parsed = schema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      `Invalid worker environment:\n${formatIssues(parsed.error)}\n` +
        'Check .env against .env.example.'
    );
  }

  const values = parsed.data;

  return {
    nodeEnv: values.NODE_ENV,
    databaseUrl: values.DATABASE_URL_DIRECT,
    redisUrl: values.REDIS_URL,
    ingestCron: values.INGEST_CRON,
    logLevel: values.LOG_LEVEL,
    userAgent: values.WORKER_USER_AGENT,
    fetchTimeoutMs: values.WORKER_FETCH_TIMEOUT_MS,
    podcastIndexApiKey: values.PODCAST_INDEX_API_KEY,
    podcastIndexApiSecret: values.PODCAST_INDEX_API_SECRET,
    ingestOnStart: values.WORKER_INGEST_ON_START,
  };
}
