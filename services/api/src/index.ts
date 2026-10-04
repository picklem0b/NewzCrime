/**
 * API entrypoint.
 *
 * Resolves configuration and dependencies, starts the listener and drains
 * connections on shutdown.
 */

import 'dotenv/config';

import { createCache } from '@newzcrime/cache';
import { createDatabase } from '@newzcrime/db';

import { createApp } from './app';
import { loadApiConfig } from './config/env';
import { createLogger } from './logger';

async function main(): Promise<void> {
  const config = loadApiConfig();
  const logger = createLogger('api', config.logLevel);

  const db = createDatabase({
    connectionString: config.databaseUrl,
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
