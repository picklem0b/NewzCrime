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
 * update check.
 *
 * The version line matches the repository's `v1.PHASE.STEP` tags, so the app
 * version, the release notes and the git tag all name the same thing. Edit this
 * block, `RELEASE_NOTES` and `apps/mobile/app.json` together when a release
 * ships; `CHANGELOG.md` is the long-form record of the same history.
 */
export const APP_RELEASE = {
  latestVersion: '1.12.6',
  minimumVersion: '1.0.0',
  downloadUrl:
    'https://expo.dev/accounts/the_devi/projects/newzcrime/builds',
} as const;

/**
 * What the app shows under "What's new".
 *
 * Only the newest release is listed: the app renders this as a single panel,
 * and the full history lives in `CHANGELOG.md`. Newest first, so `[0]` is
 * always `APP_RELEASE.latestVersion`.
 */
export const RELEASE_NOTES: ReadonlyArray<{
  version: string;
  highlights: ReadonlyArray<string>;
}> = [
  {
    version: '1.12.6',
    highlights: [
      'A calmer, faster reading layout with a lead story and topic sections',
      'Search across stories, judgments and episodes, and filter the results',
      'One place to browse every outlet and show',
      'Podcast playback says why it failed instead of staying silent',
      'Light and dark palettes, with text that follows your size setting',
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
