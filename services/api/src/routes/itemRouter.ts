import { Router } from 'express';
import type { ApiErrorBody } from '@newzcrime/shared';

/**
 * `/v1/items` — a single content item by id.
 *
 * TODO: fetch by id, return 404 when missing, cache with `CACHE_TTL.ITEM`.
 */
export const itemRouter = Router();

itemRouter.get('/:itemId', (_req, res) => {
  const body: ApiErrorBody = { error: 'not_implemented' };
  res.status(501).json(body);
});

export default itemRouter;
