/**
 * Wraps an async route so a rejected promise reaches the error middleware.
 *
 * Express 4 does not await handlers: without this, a thrown error becomes an
 * unhandled rejection and the request hangs.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
