/**
 * pg-boss setup.
 *
 * The queue lives inside Postgres, so no additional service is required. Two
 * queues: a scheduler queue that fans out, and a per-source queue that does the
 * fetching. Retries are bounded — a feed that is permanently broken should not
 * be retried forever.
 */

import PgBoss from 'pg-boss';
import type { Logger } from 'pino';

import type { WorkerConfig } from '../types';

export const INGEST_ALL_QUEUE = 'ingest-all';
export const INGEST_SOURCE_QUEUE = 'ingest-source';

export async function createQueue(
  config: WorkerConfig,
  logger: Logger
): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: config.databaseUrl,
    schema: 'pgboss',
    application_name: 'newzcrime-worker',
    max: config.nodeEnv === 'production' ? 5 : 2,
  });

  boss.on('error', (error: Error) => {
    logger.error({ err: error.message }, 'pg-boss error');
  });

  await boss.start();

  await boss.createQueue(INGEST_SOURCE_QUEUE, {
    name: INGEST_SOURCE_QUEUE,
    retryLimit: 2,
    retryDelay: 60,
    expireInMinutes: 10,
    retentionHours: 24,
  });
  await boss.createQueue(INGEST_ALL_QUEUE, {
    name: INGEST_ALL_QUEUE,
    retryLimit: 1,
    retryDelay: 60,
    expireInMinutes: 10,
    retentionHours: 24,
  });

  return boss;
}
