/**
 * Temporary verification: run the real per-source ingest job for the
 * Constitutional Court source, substituting the recorded feed for the network
 * fetch (SAFLII answers this host with a Cloudflare 403). Deleted afterwards.
 */

import 'dotenv/config';

import { createCache } from '@newzcrime/cache';
import { createDatabase, listSources } from '@newzcrime/db';
import type { NormalizedItem, Source } from '@newzcrime/shared';

import { courtNameFromCode, parseSafliiFeed } from '../src/adapters/safliiAdapter';
import { SAFLII_ZACC_FEED } from '../src/adapters/safliiAdapter.fixture';
import { loadWorkerConfig } from '../src/config/env';
import { ingestSource } from '../src/jobs/ingestSourceJob';
import { createLogger } from '../src/logger';
import type { SourceAdapter } from '../src/types';

async function main(): Promise<void> {
  const config = loadWorkerConfig();
  const logger = createLogger('verify', config.logLevel);
  const db = createDatabase({ connectionString: config.databaseUrl });
  const cache = await createCache({ url: config.redisUrl });

  const stub: SourceAdapter = {
    type: 'saflii',
    async fetchFeed(source: Source): Promise<NormalizedItem[]> {
      return parseSafliiFeed(SAFLII_ZACC_FEED, { courtName: source.name });
    },
  };

  const sources = await listSources(db);
  const court = sources.find((s) => s.name === 'Constitutional Court');
  if (!court) throw new Error('Constitutional Court source not found');

  console.log('court type:', court.type, '| content_type:', court.contentType);
  console.log('court name from code ZACC:', courtNameFromCode('ZACC'));

  const result = await ingestSource(
    { db, cache, adapters: [stub], logger },
    court.id
  );
  console.log('ingest result:', result);

  await cache.close();
  await db.close();
}

main().catch((error: unknown) => {
  console.error('verify failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
