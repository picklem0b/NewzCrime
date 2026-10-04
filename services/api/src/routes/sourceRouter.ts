import { CACHE_TTL, PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { Router } from 'express';
import { z } from 'zod';

import { sourceParamsSchema } from '../schemas/resourceParams.schema';
import {
  getSource,
  listAllSources,
  listSourceItems,
} from '../services/sourceService';
import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

const pageQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

/** `/v1/sources` — outlets and podcast shows, plus the items for each. */
export function createSourceRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const sources = await listAllSources(deps);
      res.set('Cache-Control', `public, max-age=${CACHE_TTL.SOURCES}`);
      res.json(sources);
    })
  );

  router.get(
    '/:sourceId/items',
    asyncHandler(async (req, res) => {
      const { sourceId } = sourceParamsSchema.parse(req.params);
      const page = pageQuerySchema.parse(req.query);

      const result = await listSourceItems(deps, sourceId, page);

      res.set('Cache-Control', `public, max-age=${CACHE_TTL.FEED}`);
      res.json(result);
    })
  );

  router.get(
    '/:sourceId',
    asyncHandler(async (req, res) => {
      const { sourceId } = sourceParamsSchema.parse(req.params);

      const source = await getSource(deps, sourceId);
      if (!source) {
        throw new HttpError(404, 'not_found', 'No source with that id');
      }

      res.set('Cache-Control', `public, max-age=${CACHE_TTL.SOURCES}`);
      res.json(source);
    })
  );

  return router;
}

export default createSourceRouter;
