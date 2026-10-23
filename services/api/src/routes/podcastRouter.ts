import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import { listPodcastShows } from '../services/sourceService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { publicCache } from '../utils/cacheControl';

/** `/v1/podcasts` — the curated podcast shows, for the Podcasts tab. */
export function createPodcastRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const shows = await listPodcastShows(deps);
      res.set('Cache-Control', publicCache(CACHE_TTL.SOURCES));
      res.json(shows);
    })
  );

  return router;
}

export default createPodcastRouter;
