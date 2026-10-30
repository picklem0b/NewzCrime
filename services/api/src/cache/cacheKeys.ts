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
  const sourceIds =
    query.sourceIds && query.sourceIds.length > 0
      ? [...query.sourceIds].sort().join(',')
      : 'any-sources';
  const parts = [
    query.topic ?? 'all',
    query.sourceId ?? 'any',
    sourceIds,
    query.includePodcasts ? 'podcasts' : 'articles',
    query.contentType ?? 'mixed',
    query.includeVideos ? 'with-videos' : 'no-videos',
    query.cursor ?? 'first',
    String(query.limit),
  ];
  return `${CACHE_PREFIX.FEED}${parts.join(':')}`;
}

export function itemCacheKey(itemId: string): string {
  return `${CACHE_PREFIX.ITEM}${itemId}`;
}

/** `all` lists every source; the other keys narrow to one kind. */
export function sourcesCacheKey(kind: 'all' | 'podcasts' | 'videos'): string {
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
    query.type ?? 'all-types',
    query.topic ?? 'all-topics',
    query.sourceId ?? 'any-source',
    query.sourceIds && query.sourceIds.length > 0
      ? [...query.sourceIds].sort().join(',')
      : 'any-sources',
    query.from ?? 'any-time',
    query.to ?? 'any-time',
    query.sort ?? 'newest',
    query.cursor ?? 'first',
    String(query.limit),
  ];
  return `${CACHE_PREFIX.SEARCH}${parts.join(':')}`;
}

/** Directory search has its own small key; it is never paginated. */
export function sourceSearchCacheKey(term: string, limit: number): string {
  return `${CACHE_PREFIX.SEARCH}sources:${term.trim().toLowerCase()}:${limit}`;
}
