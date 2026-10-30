/**
 * Full-text search over stored items.
 *
 * Runs against the local database; it does not proxy a third-party search API,
 * whose quota is shared across every user.
 */

import type { SearchQuery } from '@newzcrime/db';
import {
  searchItems,
  searchSources as findSources,
} from '@newzcrime/db';
import type { ContentItem, Paginated, Source } from '@newzcrime/shared';
import { CACHE_TTL } from '@newzcrime/shared';

import { searchCacheKey, sourceSearchCacheKey } from '../cache/cacheKeys';
import type { ServiceDeps } from '../types';

export async function search(
  deps: ServiceDeps,
  query: SearchQuery
): Promise<Paginated<ContentItem>> {
  const key = searchCacheKey(query);

  const cached = await deps.cache.get<Paginated<ContentItem>>(key);
  if (cached) return cached;

  const page = await searchItems(deps.db, query);
  await deps.cache.set(
    key,
    page,
    page.items.length === 0 ? CACHE_TTL.EMPTY_PAGE : CACHE_TTL.SEARCH
  );

  return page;
}

/**
 * The channel, show and outlet half of search.
 *
 * Results are small and change only when the directory does, so a longer TTL
 * is safe; the worker already invalidates the `search:` prefix when new items
 * arrive, and source edits are rarer still.
 */
export async function searchDirectory(
  deps: ServiceDeps,
  term: string,
  limit: number
): Promise<Source[]> {
  const key = sourceSearchCacheKey(term, limit);

  const cached = await deps.cache.get<Source[]>(key);
  if (cached) return cached;

  const sources = await findSources(deps.db, term, limit);
  await deps.cache.set(
    key,
    sources,
    sources.length === 0 ? CACHE_TTL.EMPTY_PAGE : CACHE_TTL.SOURCES
  );

  return sources;
}
