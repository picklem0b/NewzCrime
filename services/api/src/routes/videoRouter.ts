import type { ItemPageQuery } from '@newzcrime/db';
import {
  CACHE_TTL,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
} from '@newzcrime/shared';
import { Router } from 'express';
import { z } from 'zod';

import { getFeed } from '../services/feedService';
import { listVideoChannels } from '../services/sourceService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { pageCache, publicCache, skipConditionalGet } from '../utils/cacheControl';

const pageQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
  sourceId: z.string().uuid().optional(),
});

/**
 * `/v1/videos` — the Watch shelf.
 *
 * Videos are kept out of `/v1/feed`, so Home stays an article feed and Watch
 * can order and group by channel without polluting either.
 */
export function createVideoRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/channels',
    asyncHandler(async (_req, res) => {
      const channels = await listVideoChannels(deps);
      res.set('Cache-Control', publicCache(CACHE_TTL.SOURCES));
      res.json(channels);
    })
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const input = pageQuerySchema.parse(req.query);
      const query: ItemPageQuery = {
        cursor: input.cursor,
        limit: input.limit,
        sourceId: input.sourceId,
        contentType: 'video',
        includeVideos: true,
      };

      const page = await getFeed(deps, query);
      const isEmpty = page.items.length === 0;
      if (isEmpty) skipConditionalGet(req);

      res.set('Cache-Control', pageCache(CACHE_TTL.FEED, isEmpty));
      res.json(page);
    })
  );

  return router;
}

export default createVideoRouter;
