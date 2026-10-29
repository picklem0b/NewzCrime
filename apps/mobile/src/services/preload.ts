/**
 * Warm the screens before the reader reaches them.
 *
 * Onboarding is the one moment when the reader is guaranteed to spend a few
 * seconds not looking at the feed, so the feed is fetched then. The result goes
 * through the same cache `useFeed` reads, which means Today opens on stories
 * rather than a skeleton. Every request is best-effort: a phone with no network
 * still finishes onboarding and lands on the offline error state.
 */

import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { Topic } from '@newzcrime/shared';

import { readSettings } from '@/stores/settings.store';
import { useSourcesStore } from '@/stores/sources.store';

import { contentService } from './contentService';
import {
  FEED_CACHE_TTL_MS,
  clearFeed,
  feedCacheKey,
  readMemoryFeed,
  writeFeed,
} from './feedCache';

/** Every topic the Home tab can switch to. `all` is fetched first. */
export const PRELOAD_TOPICS: readonly Topic[] = [
  'all',
  'court',
  'crime',
  'politics',
  'world',
];

const inFlightTopics = new Map<string, Promise<void>>();
let inFlightAll: Promise<void> | null = null;

/**
 * Fetch one topic into the feed cache.
 *
 * A page that is still fresh is left alone: a tab switch or a second call
 * during onboarding should not spend a request on data the reader already has.
 */
export function preloadTopic(topic: Topic): Promise<void> {
  const key = feedCacheKey(topic, false);

  if (readMemoryFeed(key, Date.now(), FEED_CACHE_TTL_MS)) {
    return Promise.resolve();
  }

  const existing = inFlightTopics.get(key);
  if (existing) return existing;

  const request = contentService
    .feed({ topic, limit: PAGE_SIZE_DEFAULT })
    .then((page) => {
      if (page.items.length > 0) {
        writeFeed(key, page.items, page.nextCursor);
      } else {
        clearFeed(key);
      }
    })
    .catch(() => {
      // A preload is an optimisation. The screen's own request reports failure.
    })
    .finally(() => {
      inFlightTopics.delete(key);
    });

  inFlightTopics.set(key, request);
  return request;
}

/** The directory every feed row needs for its outlet label. */
function preloadSources(): Promise<void> {
  return useSourcesStore
    .getState()
    .load()
    .catch(() => undefined);
}

/**
 * Warm the default feed, then the rest in the background.
 *
 * Shared by onboarding and the boot route, so a fast double-tap cannot start
 * two parallel runs. The promise resolves when every request has settled, not
 * when the first one does.
 */
export function preloadAppContent(
  primaryTopic: Topic = 'all'
): Promise<void> {
  if (inFlightAll) return inFlightAll;

  inFlightAll = (async () => {
    await Promise.all([preloadSources(), preloadTopic(primaryTopic)]);

    // Five pages on a metered connection is not a warm-up, it is a download.
    // Data saver keeps the one page the reader is about to see.
    const rest = readSettings().dataSaver
      ? []
      : PRELOAD_TOPICS.filter((topic) => topic !== primaryTopic);

    await Promise.all(rest.map(preloadTopic));
  })().finally(() => {
    inFlightAll = null;
  });

  return inFlightAll;
}
