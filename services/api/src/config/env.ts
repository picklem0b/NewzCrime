/**
 * Reads process configuration from the environment.
 *
 * Kept separate from `index.ts` so tests can build a config without touching
 * `process.env`, and so the shape is validated in exactly one place.
 */

import type { ApiConfig } from '../types';

const DEFAULT_PORT = 4000;

const toPort = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: toPort(env.API_PORT, DEFAULT_PORT),
    corsOrigins: toList(env.CORS_ORIGINS),
    databaseUrl: env.DATABASE_URL ?? '',
    redisRestUrl: env.UPSTASH_REDIS_REST_URL ?? '',
    redisRestToken: env.UPSTASH_REDIS_REST_TOKEN ?? '',
  };
}
