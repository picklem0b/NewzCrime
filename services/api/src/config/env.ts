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
  /**
   * How many proxy hops to trust for the client IP.
   *
   * `false` when the API is reached directly. Rate limiting keys on the client
   * IP, and Express reads `X-Forwarded-For` when a proxy is trusted — so
   * trusting one that is not there lets a caller mint a fresh rate-limit bucket
   * with a header and bypass the limit entirely.
   */
  TRUST_PROXY: z
    .string()
    .default('false')
    .refine((value) => /^(true|false|\d+)$/.test(value.trim()), {
      message: 'must be true, false, or a number of proxy hops',
    }),
});

/** `true`, `false`, or a hop count, from the string form the environment holds. */
function parseTrustProxy(value: string): boolean | number {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return Number.parseInt(trimmed, 10);
}

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
    trustProxy: parseTrustProxy(values.TRUST_PROXY),
  };
}
