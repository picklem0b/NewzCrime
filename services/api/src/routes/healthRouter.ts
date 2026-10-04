import { Router } from 'express';

import type { ApiDependencies } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

/** `/health` — readiness probe reporting process and dependency state. */
export function createHealthRouter(deps: ApiDependencies): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const database = await deps.db.healthCheck();

      res.status(database ? 200 : 503).json({
        status: database ? 'ok' : 'degraded',
        database,
        cache: deps.cache.backend,
        uptimeSeconds: Math.round(process.uptime()),
      });
    })
  );

  return router;
}

export default createHealthRouter;
