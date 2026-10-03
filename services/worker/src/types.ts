/**
 * Worker contracts.
 *
 * Every ingestion source implements an adapter interface, and the job layer
 * depends only on those interfaces, so adding a source does not change the job
 * layer.
 */

import type { NormalizedItem, Source, SourceType } from '@newzcrime/shared';

/** Implemented by any adapter that can turn a `sources` row into items. */
export interface SourceAdapter {
  readonly type: SourceType;
  /** Fetch and normalise the latest items. Never writes to the database. */
  fetchFeed(source: Source): Promise<NormalizedItem[]>;
}

/** A show as returned by Podcast Index discovery. */
export interface PodcastShow {
  podcastIndexId: number;
  title: string;
  feedUrl: string;
  siteUrl: string | null;
  imageUrl: string | null;
  description: string | null;
}

/**
 * Podcast Index is used for discovery only: it returns a show's own RSS URL and
 * `rssAdapter` takes over from there, so it does not implement `SourceAdapter`.
 */
export interface PodcastIndexAdapter {
  readonly type: 'podcast_index';
  searchShows(query: string): Promise<PodcastShow[]>;
  fetchShowByFeedUrl(feedUrl: string): Promise<PodcastShow | null>;
}

/** Everything the worker process needs, resolved once at startup. */
export interface WorkerConfig {
  nodeEnv: string;
  /**
   * Direct connection (port 5432), never the Supabase transaction pooler:
   * pg-boss needs `LISTEN/NOTIFY`, which port 6543 does not support.
   */
  databaseUrl: string;
  redisRestUrl: string;
  redisRestToken: string;
  /** Cron expression for the ingest scheduler. */
  ingestCron: string;
  logLevel: string;
}
