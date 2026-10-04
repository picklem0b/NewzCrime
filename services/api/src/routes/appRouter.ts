import { APP_RELEASE, RELEASE_NOTES } from '@newzcrime/shared';
import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler';

/**
 * `/v1/app/version` — release metadata for the update check.
 *
 * The app compares its own version against `latestVersion` and refuses to run
 * below `minimumVersion`. Both live in `@newzcrime/shared`, so the client and
 * the server cannot disagree about them.
 */
export function createAppRouter(): Router {
  const router = Router();

  router.get(
    '/version',
    asyncHandler(async (_req, res) => {
      res.set('Cache-Control', 'public, max-age=600');
      res.json({ ...APP_RELEASE, notes: RELEASE_NOTES });
    })
  );

  return router;
}

export default createAppRouter;
