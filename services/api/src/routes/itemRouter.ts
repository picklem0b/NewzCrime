import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import { itemParamsSchema } from '../schemas/resourceParams.schema';
import { getItemContent } from '../services/fullTextService';
import { getItem } from '../services/itemService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { NO_STORE, publicCache } from '../utils/cacheControl';
import { HttpError } from '../utils/httpError';

/** `/v1/items` — a single content item by id, and its readable full text. */
export function createItemRouter(deps: ApiDependencies): Router {
  const router = Router();

  // Registered before `/:itemId` so the two-segment path is unambiguous even
  // to a future reader of this file.
  router.get(
    '/:itemId/content',
    asyncHandler(async (req, res) => {
      const { itemId } = itemParamsSchema.parse(req.params);

      const content = await getItemContent(deps, itemId);
      if (!content) {
        throw new HttpError(404, 'not_found', 'No item with that id');
      }

      // A ready body is stable, so it can sit in a CDN. An unavailable one is
      // retried server-side after a week; never store that verdict at the edge.
      res.set(
        'Cache-Control',
        content.status === 'ready' ? publicCache(CACHE_TTL.ITEM) : NO_STORE
      );
      res.json(content);
    })
  );

  router.get(
    '/:itemId',
    asyncHandler(async (req, res) => {
      const { itemId } = itemParamsSchema.parse(req.params);

      const item = await getItem(deps, itemId);
      if (!item) {
        throw new HttpError(404, 'not_found', 'No item with that id');
      }

      res.set('Cache-Control', publicCache(CACHE_TTL.ITEM));
      res.json(item);
    })
  );

  return router;
}

export default createItemRouter;
