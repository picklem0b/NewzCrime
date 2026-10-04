/**
 * Per-source ingest job.
 *
 * One source per job so a slow or broken feed holds up nothing else. A failure
 * is recorded and returned rather than thrown: partial success is required, and
 * a single dead feed must not fail the run.
 */

import type { Cache } from '@newzcrime/cache';
import type { ContentItemInput, Database } from '@newzcrime/db';
import { getSourceById, upsertItems } from '@newzcrime/db';
import { CACHE_PREFIX, CONTENT_TYPE } from '@newzcrime/shared';
import type PgBoss from 'pg-boss';
import type { Logger } from 'pino';

import type {
  IngestSourceJobData,
  IngestSourceResult,
  SourceAdapter,
} from '../types';
import { classifyTopic } from '../utils/classification';

export interface IngestSourceDeps {
  db: Database;
  cache: Cache;
  adapters: ReadonlyArray<SourceAdapter>;
  logger: Logger;
}

/** Fetch one source and store what came back. Never throws on feed failure. */
export async function ingestSource(
  deps: IngestSourceDeps,
  sourceId: string
): Promise<IngestSourceResult> {
  const { db, cache, adapters, logger } = deps;

  const source = await getSourceById(db, sourceId);
  if (!source) {
    logger.warn({ sourceId }, 'source no longer exists; skipping');
    return {
      sourceId,
      sourceName: 'unknown',
      fetched: 0,
      inserted: 0,
      failed: true,
      error: 'source not found',
    };
  }

  const adapter = adapters.find((candidate) => candidate.type === source.type);
  if (!adapter) {
    logger.error(
      { sourceId, type: source.type },
      'no adapter registered for source type'
    );
    return {
      sourceId,
      sourceName: source.name,
      fetched: 0,
      inserted: 0,
      failed: true,
      error: `no adapter for type ${source.type}`,
    };
  }

  try {
    const fetched = await adapter.fetchFeed(source);

    const inputs: ContentItemInput[] = fetched.map((item) => ({
      ...item,
      topic:
        source.contentType === CONTENT_TYPE.PODCAST_EPISODE
          ? null
          : classifyTopic(item.title, item.excerpt),
    }));

    const result = await upsertItems(db, source, inputs);

    // New items change every feed page and search result.
    if (result.inserted > 0) {
      await cache.delByPrefix(CACHE_PREFIX.FEED);
      await cache.delByPrefix(CACHE_PREFIX.SEARCH);
    }

    logger.info(
      {
        sourceId,
        source: source.name,
        fetched: result.total,
        inserted: result.inserted,
      },
      'source ingested'
    );

    return {
      sourceId,
      sourceName: source.name,
      fetched: result.total,
      inserted: result.inserted,
      failed: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      { sourceId, source: source.name, err: message },
      'source ingest failed'
    );

    return {
      sourceId,
      sourceName: source.name,
      fetched: 0,
      inserted: 0,
      failed: true,
      error: message,
    };
  }
}

export function createIngestSourceJob(deps: IngestSourceDeps) {
  return async (
    jobs: PgBoss.Job<IngestSourceJobData>[]
  ): Promise<IngestSourceResult[]> => {
    const results: IngestSourceResult[] = [];

    for (const job of jobs) {
      results.push(await ingestSource(deps, job.data.sourceId));
    }

    return results;
  };
}
