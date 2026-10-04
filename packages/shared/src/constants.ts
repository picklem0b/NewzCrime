/**
 * Runtime constants shared across services and clients.
 *
 * Each `satisfies` clause pins these values to the types in `./types`, so the
 * two files cannot drift.
 *
 * First-release scope: articles, court rulings and podcast episodes.
 */

import type { ContentType, ItemTopic, SourceType, Topic } from './types';

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
  SAFLII: 'saflii',
} as const satisfies Record<string, SourceType>;

/** Feed topics offered as filter chips on Home. */
export const TOPIC = {
  ALL: 'all',
  COURT: 'court',
  CRIME: 'crime',
  POLITICS: 'politics',
  WORLD: 'world',
} as const satisfies Record<string, Topic>;

/**
 * Topics an item can be tagged with. Excludes `all`, which is a filter value
 * rather than a property of any item.
 */
export const ITEM_TOPIC = {
  COURT: 'court',
  CRIME: 'crime',
  POLITICS: 'politics',
  WORLD: 'world',
} as const satisfies Record<string, ItemTopic>;

/** Every item topic, in display order. */
export const ITEM_TOPICS = [
  ITEM_TOPIC.COURT,
  ITEM_TOPIC.CRIME,
  ITEM_TOPIC.POLITICS,
  ITEM_TOPIC.WORLD,
] as const satisfies ReadonlyArray<ItemTopic>;

/** API pagination bounds. */
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

/** Cache TTLs, in seconds. */
export const CACHE_TTL = {
  FEED: 300,
  ITEM: 3600,
  SOURCES: 3600,
  SEARCH: 120,
  PODCAST_FEED: 3600,
} as const;

/**
 * Release metadata served by `GET /v1/app/version` and shown by the app's
 * update check. Edit `RELEASE_NOTES` when the app version changes.
 */
export const APP_RELEASE = {
  latestVersion: '0.2.0',
  minimumVersion: '0.1.0',
} as const;

export const RELEASE_NOTES: ReadonlyArray<{
  version: string;
  highlights: ReadonlyArray<string>;
}> = [
  {
    version: '0.2.0',
    highlights: [
      'Live news feed from South African outlets',
      'Court, crime, politics and world filters',
      'Read headlines aloud and share stories',
      'Curated crime and true-life podcasts with background playback',
    ],
  },
];

/** Prefixes for every cached key, so the worker can invalidate in bulk. */
export const CACHE_PREFIX = {
  FEED: 'feed:',
  ITEM: 'item:',
  SOURCES: 'sources:',
  SEARCH: 'search:',
} as const;
