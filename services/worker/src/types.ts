/**
 * Worker contracts.
 *
 * Every ingestion source implements an adapter interface, and the job layer
 * depends only on those interfaces, so adding a source does not change the job
 * layer. Configuration for the process is described here too.
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

/** Options the RSS adapter needs to fetch politely. */
export interface RssAdapterOptions {
  /** Sent as the `User-Agent`; some publishers reject unknown clients. */
  userAgent: string;
  /** Abort a feed fetch after this long. */
  timeoutMs: number;
  /** Upper bound on items taken from one feed. */
  maxItems?: number;
}

/** Options for Podcast Index discovery. Skipped when the key is empty. */
export interface PodcastIndexAdapterOptions {
  apiKey: string;
  apiSecret: string;
  timeoutMs: number;
}

/** Log levels accepted by pino. */
export type LogLevel =
  | 'fatal'
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'trace';

/** Everything the worker process needs, resolved once at startup. */
export interface WorkerConfig {
  nodeEnv: 'development' | 'test' | 'production';
  /**
   * Direct connection (port 5432), never the Supabase transaction pooler:
   * pg-boss needs `LISTEN/NOTIFY`, which port 6543 does not support.
   */
  databaseUrl: string;
  /** TCP Redis endpoint, e.g. `redis://127.0.0.1:6379`. */
  redisUrl: string;
  ingestCron: string;
  logLevel: LogLevel;
  /** Sent to publishers that reject unknown user agents. */
  userAgent: string;
  /** Per-request timeout when fetching a feed. */
  fetchTimeoutMs: number;
  /** Podcast Index API key and secret; discovery is skipped when either is empty. */
  podcastIndexApiKey: string;
  podcastIndexApiSecret: string;
  /** Kick off one ingest run as soon as the worker starts. */
  ingestOnStart: boolean;
}

/** Payload of the per-source ingest job. */
export interface IngestSourceJobData {
  sourceId: string;
}

/** Result of one source ingest, recorded in the log. */
export interface IngestSourceResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  inserted: number;
  failed: boolean;
  error?: string;
}
