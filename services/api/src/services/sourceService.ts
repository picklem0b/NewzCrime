/**
 * Outlets and podcast shows.
 *
 * Both are rows in `sources`, distinguished by `contentType`. The table is
 * small, so the podcast filter runs in memory rather than adding a query.
 */

import type { ItemPageQuery } from '@newzcrime/db';
import { getSourceById, listItemsBySource, listSources } from '@newzcrime/db';
import type { ContentItem, Paginated, Source } from '@newzcrime/shared';
import { CACHE_TTL, CONTENT_TYPE } from '@newzcrime/shared';

import {
  sourceCacheKey,
  sourceItemsCacheKey,
  sourcesCacheKey,
} from '../cache/cacheKeys';
import type { ServiceDeps } from '../types';

async function loadSources(deps: ServiceDeps): Promise<Source[]> {
  const key = sourcesCacheKey('all');

  const cached = await deps.cache.get<Source[]>(key);
  if (cached) return cached;

  const sources = await listSources(deps.db);
  await deps.cache.set(key, sources, CACHE_TTL.SOURCES);

  return sources;
}

export async function listAllSources(deps: ServiceDeps): Promise<Source[]> {
  return loadSources(deps);
}

export async function listPodcastShows(deps: ServiceDeps): Promise<Source[]> {
  const sources = await loadSources(deps);
  return sources.filter(
    (source) => source.contentType === CONTENT_TYPE.PODCAST_EPISODE
  );
}

export async function getSource(
  deps: ServiceDeps,
  sourceId: string
): Promise<Source | null> {
  const key = sourceCacheKey(sourceId);

  const cached = await deps.cache.get<Source>(key);
  if (cached) return cached;

  const source = await getSourceById(deps.db, sourceId);
  if (source) await deps.cache.set(key, source, CACHE_TTL.SOURCES);

  return source;
}

export async function listSourceItems(
  deps: ServiceDeps,
  sourceId: string,
  page: Pick<ItemPageQuery, 'cursor' | 'limit'>
): Promise<Paginated<ContentItem>> {
  const key = sourceItemsCacheKey(sourceId, page);

  const cached = await deps.cache.get<Paginated<ContentItem>>(key);
  if (cached) return cached;

  const result = await listItemsBySource(deps.db, sourceId, {
    cursor: page.cursor,
    limit: page.limit,
  });
  await deps.cache.set(key, result, CACHE_TTL.FEED);

  return result;
}
