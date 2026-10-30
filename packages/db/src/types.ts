/**
 * Database contracts and row shapes.
 *
 * Re-uses the concrete `pg` types rather than redeclaring them, so callers keep
 * full row typing. Rows are snake_case because that is how Postgres returns
 * them; the repositories map them to the camelCase domain types in
 * `@newzcrime/shared`.
 */

import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

import type {
  ContentType,
  ItemTopic,
  NormalizedItem,
  Province,
  SourceCategory,
  SourceType,
} from '@newzcrime/shared';

/** Connection settings, mapped from `DATABASE_URL` / `DATABASE_URL_DIRECT`. */
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean;
  /** Receives background pool errors so they are logged, not thrown. */
  onError?: (error: Error) => void;
}

/** The pooled database handle passed around by dependency injection. */
export interface Database {
  readonly pool: Pool;
  /** Run a parameterised query and get exactly-typed rows back. */
  query<TRow extends QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<TRow>>;
  /** Check out a client for a multi-statement transaction. */
  withClient<TResult>(
    run: (client: PoolClient) => Promise<TResult>
  ): Promise<TResult>;
  /** Cheap readiness probe for `/health`. */
  healthCheck(): Promise<boolean>;
  /** Drain the pool on shutdown. */
  close(): Promise<void>;
}

/** An adapter item carrying the topic the job layer classified for it. */
export interface ContentItemInput extends NormalizedItem {
  topic: ItemTopic | null;
}

/** A row of `sources`, as stored. */
export interface SourceRow extends QueryResultRow {
  id: string;
  name: string;
  type: SourceType;
  content_type: ContentType;
  feed_url: string;
  site_url: string | null;
  logo_url: string | null;
  description: string | null;
  province: Province | null;
  category: SourceCategory | null;
  is_active: boolean;
  created_at: Date;
}

/** A row of `content_items`, as stored. */
export interface ContentItemRow extends QueryResultRow {
  id: string;
  source_id: string;
  type: ContentType;
  topic: ItemTopic | null;
  external_id: string;
  title: string;
  url: string;
  excerpt: string | null;
  image_url: string | null;
  audio_url: string | null;
  author: string | null;
  published_at: Date;
  view_count: string | null;
  like_count: number | null;
  created_at: Date;
}

/** The cached body columns of `content_items`, read separately from the feed. */
export interface ItemBodyRow extends QueryResultRow {
  body: string | null;
  body_fetched_at: Date | null;
}

/** Cursor page request shared by the item list queries. */
export interface ItemPageQuery {
  cursor?: string | undefined;
  limit: number;
  topic?: ItemTopic | undefined;
  sourceId?: string | undefined;
  /** Several sources at once, for the following shelf. */
  sourceIds?: string[] | undefined;
  includePodcasts?: boolean | undefined;
  /** Exact content type, for the Watch shelf. */
  contentType?: ContentType | undefined;
  /** Home excludes video; the Watch endpoint opts back in. */
  includeVideos?: boolean | undefined;
}

/** Ordering for search results. */
export type SearchSort = 'newest' | 'oldest';

/** Full-text search request, with the advanced filters the app exposes. */
export interface SearchQuery {
  query: string;
  cursor?: string | undefined;
  limit: number;
  type?: ContentType | undefined;
  topic?: ItemTopic | undefined;
  sourceId?: string | undefined;
  /** Restrict to several followed sources. */
  sourceIds?: string[] | undefined;
  /** ISO timestamp; results published before this are excluded. */
  from?: string | undefined;
  /** ISO timestamp; results published after this are excluded. */
  to?: string | undefined;
  sort?: SearchSort | undefined;
}

/** Opaque pagination cursor, decoded for the `WHERE` clause. */
export interface Cursor {
  publishedAt: string;
  id: string;
}
