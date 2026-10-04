/**
 * Terminal error handling.
 *
 * Every failure leaves as `ApiErrorBody`, so a client has one shape to parse.
 * Expected failures are thrown as `HttpError`; anything else is logged with its
 * stack and reported as an opaque 500.
 */

import type { ApiErrorBody } from '@newzcrime/shared';
import type { NextFunction, Request, Response } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';

import { HttpError } from '../utils/httpError';

export function notFoundMiddleware(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: 'not_found',
    message: `No route for ${req.method} ${req.path}`,
  };
  res.status(404).json(body);
}

export function createErrorMiddleware(logger: Logger) {
  return (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof HttpError) {
      const body: ApiErrorBody = {
        error: error.code,
        message: error.message,
        details: error.details,
      };
      res.status(error.status).json(body);
      return;
    }

    if (error instanceof ZodError) {
      const body: ApiErrorBody = {
        error: 'invalid_request',
        message: 'Request validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
      res.status(400).json(body);
      return;
    }

    logger.error(
      {
        err: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        method: req.method,
        path: req.path,
      },
      'unhandled request error'
    );

    const body: ApiErrorBody = {
      error: 'internal_error',
      message: 'Something went wrong',
    };
    res.status(500).json(body);
  };
}
