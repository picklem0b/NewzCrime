import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import { searchQuerySchema } from '../schemas/searchQuery.schema';
import { search } from '../services/searchService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * `/v1/search` — full-text search over stored items.
 *
 * Search runs against the local database and does not proxy third-party search
 * APIs, whose quotas are shared across all users.
 */
export function createSearchRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const input = searchQuerySchema.parse(req.query);

      const page = await search(deps, {
        query: input.q,
        cursor: input.cursor,
        limit: input.limit,
      });

      res.set('Cache-Control', `public, max-age=${CACHE_TTL.SEARCH}`);
      res.json(page);
    })
  );

  return router;
}

export default createSearchRouter;
