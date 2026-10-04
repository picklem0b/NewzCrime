/**
 * Ingestion worker entrypoint.
 *
 * Wires configuration, the database, the cache and the adapters, then starts
 * pg-boss with the fan-out scheduler and the per-source handler. Shutdown
 * drains the queue before closing the pool.
 */

import 'dotenv/config';

import { createCache } from '@newzcrime/cache';
import { createDatabase } from '@newzcrime/db';

import { createAdapters } from './adapters';
import { loadWorkerConfig } from './config/env';
import { createIngestAllJob } from './jobs/ingestAllJob';
import { createIngestSourceJob } from './jobs/ingestSourceJob';
import { createLogger } from './logger';
import {
  createQueue,
  INGEST_ALL_QUEUE,
  INGEST_SOURCE_QUEUE,
} from './queue/queue';

async function main(): Promise<void> {
  const config = loadWorkerConfig();
  const logger = createLogger('worker', config.logLevel);

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

  const adapters = createAdapters(config);

  const boss = await createQueue(config, logger);

  await boss.work(INGEST_SOURCE_QUEUE, createIngestSourceJob({ db, cache, adapters, logger }));
  await boss.work(INGEST_ALL_QUEUE, createIngestAllJob({ db, sender: boss, logger }));

  await boss.schedule(INGEST_ALL_QUEUE, config.ingestCron, {});

  logger.info(
    { cron: config.ingestCron, cache: cache.backend },
    'worker started'
  );

  if (config.ingestOnStart) {
    await boss.send(INGEST_ALL_QUEUE, {});
    logger.info('queued an ingest run for startup');
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutting down');
    await boss.stop({ graceful: true });
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
    '[worker] failed to start:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
