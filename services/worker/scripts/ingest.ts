/**
 * One-shot ingest.
 *
 * Runs the per-source job directly, without pg-boss, and exits. Used to fill a
 * fresh database and to check that adapters still parse a publisher's feed:
 * `pnpm --filter @newzcrime/worker ingest [sourceId]`.
 */

import dotenv from 'dotenv';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCache } from '@newzcrime/cache';
import { createDatabase, listActiveSources } from '@newzcrime/db';

import { createAdapters } from '../src/adapters';
import { loadWorkerConfig } from '../src/config/env';
import { ingestSource } from '../src/jobs/ingestSourceJob';
import { createLogger } from '../src/logger';

// pnpm runs this from services/worker; the connection string lives in the
// repository's .env, which is also what `db:setup` reads.
dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'),
});

async function main(): Promise<void> {
  const config = loadWorkerConfig();
  const logger = createLogger('ingest', config.logLevel);

  const db = createDatabase({ connectionString: config.databaseUrl });
  const cache = await createCache({ url: config.redisUrl });
  const adapters = createAdapters(config);

  const requestedId = process.argv[2];
  const sources = await listActiveSources(db);
  const targets = requestedId
    ? sources.filter((source) => source.id === requestedId)
    : sources;

  if (targets.length === 0) {
    logger.warn(
      { requestedId },
      requestedId ? 'no active source with that id' : 'no active sources'
    );
  }

  let inserted = 0;
  let failed = 0;

  for (const source of targets) {
    const result = await ingestSource(
      { db, cache, adapters, logger },
      source.id
    );
    inserted += result.inserted;
    if (result.failed) failed += 1;
  }

  logger.info(
    { sources: targets.length, inserted, failed },
    'ingest run complete'
  );

  await cache.close();
  await db.close();
}

main().catch((error: unknown) => {
  console.error(
    '[ingest] failed:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
