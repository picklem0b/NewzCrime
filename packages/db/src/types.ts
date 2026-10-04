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
  author: string | null;
  published_at: Date;
  created_at: Date;
}

/** Cursor page request shared by the item list queries. */
export interface ItemPageQuery {
  cursor?: string | undefined;
  limit: number;
  topic?: ItemTopic | undefined;
  sourceId?: string | undefined;
  includePodcasts?: boolean | undefined;
}

/** Full-text search request. */
export interface SearchQuery {
  query: string;
  cursor?: string | undefined;
  limit: number;
}

/** Opaque pagination cursor, decoded for the `WHERE` clause. */
export interface Cursor {
  publishedAt: string;
  id: string;
}
