/**
 * Shared domain model.
 *
 * Types only; the values that fill them live in `./constants`.
 */

/** How a piece of content reaches the reader. */
export type ContentType =
  | 'article'
  | 'court_ruling'
  | 'podcast_episode'
  | 'video';

/**
 * How the worker ingests a source.
 *
 * `saflii` is RSS too, but its items carry no dates or excerpts, so it has a
 * normaliser of its own rather than sharing the generic RSS one. `youtube` is
 * also RSS (the channel feed), but its entries carry video ids and media
 * thumbnails that the generic adapter would discard.
 */
export type SourceType = 'rss' | 'podcast_index' | 'saflii' | 'youtube';

/** A topic an item can carry. Items with no match stay untagged. */
export type ItemTopic = 'court' | 'crime' | 'politics' | 'world';

/** A South African province, used to surface genuinely local updates. */
export type Province =
  | 'gauteng'
  | 'western_cape'
  | 'kwazulu_natal'
  | 'eastern_cape'
  | 'free_state'
  | 'limpopo'
  | 'mpumalanga'
  | 'north_west'
  | 'northern_cape';

/** The editorial shelf a video channel belongs to. */
export type SourceCategory = 'news' | 'true_crime' | 'courts' | 'local';

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
  /** Province for a local video channel; `null` for national outlets. */
  province: Province | null;
  /** Playlist a video channel belongs to; `null` for non-video sources. */
  category: SourceCategory | null;
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
  /** Podcast audio enclosure. `null` for anything without playable audio. */
  audioUrl: string | null;
  author: string | null;
  publishedAt: string;
  /** YouTube view count; absent for articles and podcasts. */
  viewCount?: number | null;
  /** YouTube like count; absent for articles and podcasts. */
  likeCount?: number | null;
}

/** A stored item, as returned by the public API. */
export interface ContentItem extends NormalizedItem {
  id: string;
  sourceId: string;
  type: ContentType;
  /** Classified topic, or `null` when the text matched nothing. */
  topic: ItemTopic | null;
}

/**
 * The readable body of an item, fetched from the publisher page on demand.
 *
 * `status` is `ready` only when `body` holds usable article text. A publisher
 * that blocks extraction, shows a paywall or serves a page too short to be the
 * story yields `unavailable`, and the app falls back to the excerpt and link.
 */
export interface ItemContent {
  itemId: string;
  status: 'ready' | 'unavailable';
  body: string | null;
  /** When extraction was last attempted, successful or not. */
  fetchedAt: string;
  /** The publisher's canonical page, for attribution and the open button. */
  sourceUrl: string;
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
  /** Several sources at once, for the following shelf. */
  sourceIds?: string[];
  includePodcasts?: boolean;
  includeVideos?: boolean;
  cursor?: string;
  limit?: number;
}

/** Body returned by every failing endpoint. */
export interface ApiErrorBody {
  error: string;
  message?: string;
  details?: unknown;
}
