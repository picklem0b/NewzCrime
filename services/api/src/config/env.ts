/**
 * Reads and validates process configuration from the environment.
 *
 * Validation runs at startup so a missing or malformed variable stops the
 * process with a readable message, rather than surfacing halfway through a
 * request. Kept separate from `index.ts` so tests can build a config without
 * touching `process.env`.
 */

import { z } from 'zod';

import type { ApiConfig, LogLevel } from '../types';

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
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default(''),
  DATABASE_URL: z.string().min(1, 'is required'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
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

const toList = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export function loadApiConfig(
  env: NodeJS.ProcessEnv = process.env
): ApiConfig {
  const parsed = schema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      `Invalid API environment:\n${formatIssues(parsed.error)}\n` +
        'Check .env against .env.example.'
    );
  }

  const values = parsed.data;

  return {
    nodeEnv: values.NODE_ENV,
    port: values.API_PORT,
    corsOrigins: toList(values.CORS_ORIGINS),
    databaseUrl: values.DATABASE_URL,
    redisUrl: values.REDIS_URL,
    logLevel: values.LOG_LEVEL,
    rateLimitMax: values.API_RATE_LIMIT_MAX,
    rateLimitWindowMs: values.API_RATE_LIMIT_WINDOW_MS,
  };
}
