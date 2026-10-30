/**
 * Runtime constants shared across services and clients.
 *
 * Each `satisfies` clause pins these values to the types in `./types`, so the
 * two files cannot drift.
 *
 * First-release scope: articles, court rulings and podcast episodes.
 */

import type {
  ContentType,
  ItemTopic,
  Province,
  SourceCategory,
  SourceType,
  Topic,
} from './types';

/** Content kinds stored in `content_items.type`. */
export const CONTENT_TYPE = {
  ARTICLE: 'article',
  COURT_RULING: 'court_ruling',
  PODCAST_EPISODE: 'podcast_episode',
  VIDEO: 'video',
} as const satisfies Record<string, ContentType>;

/** Ingestion source kinds handled by worker adapters. */
export const SOURCE_TYPE = {
  RSS: 'rss',
  PODCAST_INDEX: 'podcast_index',
  SAFLII: 'saflii',
  YOUTUBE: 'youtube',
} as const satisfies Record<string, SourceType>;

/** Editorial shelves for video channels. */
export const SOURCE_CATEGORY = {
  NEWS: 'news',
  TRUE_CRIME: 'true_crime',
  COURTS: 'courts',
  LOCAL: 'local',
} as const satisfies Record<string, SourceCategory>;

/** Every province, in display order. */
export const PROVINCES = [
  'gauteng',
  'western_cape',
  'kwazulu_natal',
  'eastern_cape',
  'free_state',
  'limpopo',
  'mpumalanga',
  'north_west',
  'northern_cape',
] as const satisfies ReadonlyArray<Province>;

/** Human-readable province names, shared by the API and the app. */
export const PROVINCE_LABEL: Record<Province, string> = {
  gauteng: 'Gauteng',
  western_cape: 'Western Cape',
  kwazulu_natal: 'KwaZulu-Natal',
  eastern_cape: 'Eastern Cape',
  free_state: 'Free State',
  limpopo: 'Limpopo',
  mpumalanga: 'Mpumalanga',
  north_west: 'North West',
  northern_cape: 'Northern Cape',
};

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
  /**
   * An empty page is cached only briefly. A cold database that has just been
   * seeded by the ingester would otherwise keep serving "no stories" for the
   * full feed TTL, which looks like a broken app rather than a quiet feed.
   */
  EMPTY_PAGE: 15,
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
  latestVersion: '1.15.15',
  minimumVersion: '1.0.0',
  /**
   * Direct APK, not a page. The app downloads this itself and hands it to the
   * Android package installer, so a link to a builds dashboard would fail.
   * Point these at the GitHub Releases produced by the android-build workflow.
   */
  downloadUrl:
    'https://github.com/picklem0b/NewzCrime/releases/latest/download/newzcrime.apk',
  betaDownloadUrl:
    'https://github.com/picklem0b/NewzCrime/releases/download/beta/newzcrime-beta.apk',
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
    version: '1.15.15',
    highlights: [
      'A new Watch tab: live courts, true crime, national news and local channels',
      'Search now finds stories, judgments, channels, podcasts and video, with advanced filters',
      'Discover lists every newsletter, YouTube channel and podcast in one place',
      'Follow any outlet, channel or show to put its newest items first',
      'A one-time illustrated introduction, with the feed preloaded before the first tab',
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
