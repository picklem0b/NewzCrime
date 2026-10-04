/**
 * Shared domain model.
 *
 * Types only; the values that fill them live in `./constants`.
 */

/** How a piece of content reaches the reader. */
export type ContentType = 'article' | 'court_ruling' | 'podcast_episode';

/** How the worker ingests a source. */
export type SourceType = 'rss' | 'podcast_index';

/** A topic an item can carry. Items with no match stay untagged. */
export type ItemTopic = 'court' | 'crime' | 'politics' | 'world';

/** Feed filters the client may ask for. `all` means no topic filter. */
export type Topic = 'all' | ItemTopic;

/** A news outlet or a podcast show — both are rows in `sources`. */
export interface Source {
  id: string;
  name: string;
  type: SourceType;
  /** Content kind every item from this source is stored as. */
  contentType: ContentType;
  feedUrl: string;
  siteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  createdAt: string;
}

/**
 * An item as produced by an ingestion adapter, before the job layer assigns a
 * local id. Adapters return this shape and never talk to the database.
 */
export interface NormalizedItem {
  externalId: string;
  title: string;
  url: string;
  excerpt: string | null;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;
}

/** A stored item, as returned by the public API. */
export interface ContentItem extends NormalizedItem {
  id: string;
  sourceId: string;
  type: ContentType;
  /** Classified topic, or `null` when the text matched nothing. */
  topic: ItemTopic | null;
}

/** Cursor-paginated list envelope. */
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

/** Query accepted by `GET /v1/feed`. */
export interface FeedQuery {
  topic?: Topic;
  sourceId?: string;
  includePodcasts?: boolean;
  cursor?: string;
  limit?: number;
}

/** Body returned by every failing endpoint. */
export interface ApiErrorBody {
  error: string;
  message?: string;
  details?: unknown;
}
