/**
 * Cache key builders.
 *
 * Keys are namespaced by the prefixes in `@newzcrime/shared`, so the worker can
 * invalidate a whole namespace at once when new items land. Every parameter
 * that changes the result is part of the key.
 */

import type { ItemPageQuery, SearchQuery } from '@newzcrime/db';
import { CACHE_PREFIX } from '@newzcrime/shared';

export function feedCacheKey(query: ItemPageQuery): string {
  const parts = [
    query.topic ?? 'all',
    query.sourceId ?? 'any',
    query.includePodcasts ? 'podcasts' : 'articles',
    query.cursor ?? 'first',
    String(query.limit),
  ];
  return `${CACHE_PREFIX.FEED}${parts.join(':')}`;
}

export function itemCacheKey(itemId: string): string {
  return `${CACHE_PREFIX.ITEM}${itemId}`;
}

/** `all` lists outlets and shows together; `podcasts` lists shows only. */
export function sourcesCacheKey(kind: 'all' | 'podcasts'): string {
  return `${CACHE_PREFIX.SOURCES}${kind}`;
}

export function sourceCacheKey(sourceId: string): string {
  return `${CACHE_PREFIX.SOURCES}source:${sourceId}`;
}

export function sourceItemsCacheKey(
  sourceId: string,
  page: Pick<ItemPageQuery, 'cursor' | 'limit'>
): string {
  return `${CACHE_PREFIX.FEED}source:${sourceId}:${page.cursor ?? 'first'}:${page.limit}`;
}

export function searchCacheKey(query: SearchQuery): string {
  const parts = [
    query.query.trim().toLowerCase(),
    query.cursor ?? 'first',
    String(query.limit),
  ];
  return `${CACHE_PREFIX.SEARCH}${parts.join(':')}`;
}
