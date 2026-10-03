import { Router } from 'express';
import type { ApiErrorBody } from '@newzcrime/shared';

/**
 * `/v1/sources` — outlets and podcast shows, plus the items for each.
 *
 * TODO: list sources, fetch one source and fetch its items.
 */
export const sourceRouter = Router();

sourceRouter.get('/', (_req, res) => {
  const body: ApiErrorBody = { error: 'not_implemented' };
  res.status(501).json(body);
});

sourceRouter.get('/:sourceId', (_req, res) => {
  const body: ApiErrorBody = { error: 'not_implemented' };
  res.status(501).json(body);
});

export default sourceRouter;
