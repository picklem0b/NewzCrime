import { CACHE_TTL } from '@newzcrime/shared';
import { Router } from 'express';

import { itemParamsSchema } from '../schemas/resourceParams.schema';
import { getItem } from '../services/itemService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

/** `/v1/items` — a single content item by id. */
export function createItemRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/:itemId',
    asyncHandler(async (req, res) => {
      const { itemId } = itemParamsSchema.parse(req.params);

      const item = await getItem(deps, itemId);
      if (!item) {
        throw new HttpError(404, 'not_found', 'No item with that id');
      }

      res.set('Cache-Control', `public, max-age=${CACHE_TTL.ITEM}`);
      res.json(item);
    })
  );

  return router;
}

export default createItemRouter;
