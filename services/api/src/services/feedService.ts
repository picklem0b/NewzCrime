/** The Home feed: reverse-chronological items, served through the cache. */

import type { ItemPageQuery } from '@newzcrime/db';
import { listItems } from '@newzcrime/db';
import type { ContentItem, Paginated } from '@newzcrime/shared';
import { CACHE_TTL } from '@newzcrime/shared';

import { feedCacheKey } from '../cache/cacheKeys';
import type { ServiceDeps } from '../types';

export async function getFeed(
  deps: ServiceDeps,
  query: ItemPageQuery
): Promise<Paginated<ContentItem>> {
  const key = feedCacheKey(query);

  const cached = await deps.cache.get<Paginated<ContentItem>>(key);
  if (cached) return cached;

  const page = await listItems(deps.db, query);
  await deps.cache.set(key, page, CACHE_TTL.FEED);

  return page;
}
