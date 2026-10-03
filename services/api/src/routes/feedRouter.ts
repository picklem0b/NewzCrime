import { Router } from 'express';
import type { ApiErrorBody } from '@newzcrime/shared';

/**
 * `/v1/feed` — reverse-chronological feed of court, crime and news items.
 *
 * Query: `?topic= &sourceId= &includePodcasts=1 &cursor= &limit=`
 *
 * TODO: validate against `FeedQuery`, read through the cache and query
 * Postgres. Handlers belong in `../services`; this file wires paths only.
 */
export const feedRouter = Router();

feedRouter.get('/', (_req, res) => {
  const body: ApiErrorBody = { error: 'not_implemented' };
  res.status(501).json(body);
});

export default feedRouter;
