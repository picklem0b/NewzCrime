/**
 * Runtime constants shared across services and clients.
 *
 * Each `satisfies` clause pins these values to the types in `./types`, so the
 * two files cannot drift.
 *
 * First-release scope: articles, court rulings and podcast episodes.
 */

import type { ContentType, SourceType, Topic } from './types';

/** Content kinds stored in `content_items.type`. */
export const CONTENT_TYPE = {
  ARTICLE: 'article',
  COURT_RULING: 'court_ruling',
  PODCAST_EPISODE: 'podcast_episode',
} as const satisfies Record<string, ContentType>;

/** Ingestion source kinds handled by worker adapters. */
export const SOURCE_TYPE = {
  RSS: 'rss',
  PODCAST_INDEX: 'podcast_index',
} as const satisfies Record<string, SourceType>;

/** Feed topics offered as filter chips on Home. */
export const TOPIC = {
  ALL: 'all',
  COURT: 'court',
  CRIME: 'crime',
  POLITICS: 'politics',
  WORLD: 'world',
} as const satisfies Record<string, Topic>;

/** API pagination bounds. */
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

/** Cache TTLs, in seconds. */
export const CACHE_TTL = {
  FEED: 300,
  ITEM: 3600,
  PODCAST_FEED: 3600,
} as const;
