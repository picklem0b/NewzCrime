import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import {
  searchQuerySchema,
  sourceSearchQuerySchema,
} from '../schemas/searchQuery.schema';
import { search, searchDirectory } from '../services/searchService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { pageCache, publicCache, skipConditionalGet } from '../utils/cacheControl';

/**
 * `/v1/search` — full-text search over stored items.
 *
 * `/v1/search/sources` — the matching rows in the directory, so a query can
 * find a channel or podcast whose name never appears in an item title.
 *
 * Search runs against the local database and does not proxy third-party search
 * APIs, whose quotas are shared across all users.
 */
export function createSearchRouter(deps: ApiDependencies): Router {
  const router = Router();

  // Registered before the item search so the path is explicit and cannot be
  // mistaken for a query parameter in a future refactor.
  router.get(
    '/sources',
    asyncHandler(async (req, res) => {
      const input = sourceSearchQuerySchema.parse(req.query);
      const sources = await searchDirectory(deps, input.q, input.limit);

      if (sources.length === 0) skipConditionalGet(req);
      res.set(
        'Cache-Control',
        publicCache(sources.length === 0 ? CACHE_TTL.EMPTY_PAGE : CACHE_TTL.SOURCES)
      );
      res.json(sources);
    })
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const input = searchQuerySchema.parse(req.query);

      const page = await search(deps, {
        query: input.q,
        cursor: input.cursor,
        limit: input.limit,
        type: input.type,
        topic: input.topic,
        sourceId: input.sourceId,
        sourceIds: input.sourceIds,
        from: input.from,
        to: input.to,
        sort: input.sort,
      });

      const isEmpty = page.items.length === 0;
      if (isEmpty) skipConditionalGet(req);

      res.set('Cache-Control', pageCache(CACHE_TTL.SEARCH, isEmpty));
      res.json(page);
    })
  );

  return router;
}

export default createSearchRouter;
