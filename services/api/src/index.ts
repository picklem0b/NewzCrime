/**
 * API entrypoint.
 *
 * Resolves configuration and dependencies, starts the listener and drains
 * connections on shutdown.
 */

import dotenv from 'dotenv';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCache } from '@newzcrime/cache';
import { createDatabase } from '@newzcrime/db';

import { createApp } from './app';
import { loadApiConfig } from './config/env';
import { createLogger } from './logger';

// pnpm runs the workspace script from services/api, so the default
// `dotenv/config` would look in the wrong directory. Load the root file the
// setup guide tells the reader to edit; process env still wins over it.
dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'),
});

async function main(): Promise<void> {
  const config = loadApiConfig();
  const logger = createLogger('api', config.logLevel);

  const db = createDatabase({
    connectionString: config.databaseUrl,
    maxConnections: config.databasePoolMax,
    onError: (error) =>
      logger.error({ err: error.message }, 'database pool error'),
  });

  const cache = await createCache({
    url: config.redisUrl,
    onFallback: (reason) =>
      logger.warn({ reason }, 'redis unavailable; using in-memory cache'),
  });

  const app = createApp({ config, db, cache, logger });

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.nodeEnv, cache: cache.backend },
      'api listening'
    );
  });

  // Render's free instance is single and slow to restart, so a half-open
  // keep-alive connection is expensive: these bounds recycle it before the
  // platform's proxy does, and a stuck request cannot hold the only worker.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 30_000;

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await cache.close();
    await db.close();
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown(signal)
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          logger.error(
            { err: error instanceof Error ? error.message : String(error) },
            'shutdown failed'
          );
          process.exit(1);
        });
    });
  }
}

main().catch((error: unknown) => {
  console.error(
    '[api] failed to start:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
