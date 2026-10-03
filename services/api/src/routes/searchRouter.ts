import { Router } from 'express';
import type { ApiErrorBody } from '@newzcrime/shared';

/**
 * `/v1/search` — full-text search over stored items.
 *
 * Search runs against the local database; it does not proxy third-party search
 * APIs, whose quotas are shared across all users.
 *
 * TODO: Postgres full-text search with rate limiting.
 */
export const searchRouter = Router();

searchRouter.get('/', (_req, res) => {
  const body: ApiErrorBody = { error: 'not_implemented' };
  res.status(501).json(body);
});

export default searchRouter;
