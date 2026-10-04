/**
 * Full-text search over stored items.
 *
 * Runs against the local database; it does not proxy a third-party search API,
 * whose quota is shared across every user.
 */

import type { SearchQuery } from '@newzcrime/db';
import { searchItems } from '@newzcrime/db';
import type { ContentItem, Paginated } from '@newzcrime/shared';
import { CACHE_TTL } from '@newzcrime/shared';

import { searchCacheKey } from '../cache/cacheKeys';
import type { ServiceDeps } from '../types';

export async function search(
  deps: ServiceDeps,
  query: SearchQuery
): Promise<Paginated<ContentItem>> {
  const key = searchCacheKey(query);

  const cached = await deps.cache.get<Paginated<ContentItem>>(key);
  if (cached) return cached;

  const page = await searchItems(deps.db, query);
  await deps.cache.set(key, page, CACHE_TTL.SEARCH);

  return page;
}
