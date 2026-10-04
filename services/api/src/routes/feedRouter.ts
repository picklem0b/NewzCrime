import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import { feedQuerySchema, toItemTopic } from '../schemas/feedQuery.schema';
import { getFeed } from '../services/feedService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * `/v1/feed` — reverse-chronological feed of court, crime and news items.
 *
 * Query: `?topic= &sourceId= &includePodcasts=1 &cursor= &limit=`
 */
export function createFeedRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const input = feedQuerySchema.parse(req.query);

      const page = await getFeed(deps, {
        cursor: input.cursor,
        limit: input.limit,
        topic: toItemTopic(input.topic),
        sourceId: input.sourceId,
        includePodcasts: input.includePodcasts,
      });

      res.set('Cache-Control', `public, max-age=${CACHE_TTL.FEED}`);
      res.json(page);
    })
  );

  return router;
}

export default createFeedRouter;
