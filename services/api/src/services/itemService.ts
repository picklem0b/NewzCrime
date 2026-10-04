/** A single content item by id. */

import { getItemById } from '@newzcrime/db';
import type { ContentItem } from '@newzcrime/shared';
import { CACHE_TTL } from '@newzcrime/shared';

import { itemCacheKey } from '../cache/cacheKeys';
import type { ServiceDeps } from '../types';

export async function getItem(
  deps: ServiceDeps,
  itemId: string
): Promise<ContentItem | null> {
  const key = itemCacheKey(itemId);

  const cached = await deps.cache.get<ContentItem>(key);
  if (cached) return cached;

  const item = await getItemById(deps.db, itemId);
  if (item) await deps.cache.set(key, item, CACHE_TTL.ITEM);

  return item;
}
