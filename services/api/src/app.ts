/**
 * Express application factory.
 *
 * Separated from the listener so tests can import the app without binding a
 * port, and so middleware order is defined in one place: security, CORS,
 * compression, logging, body parsing and rate limiting all run before a route,
 * and the error handlers run last.
 */

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import type { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import {
  createErrorMiddleware,
  notFoundMiddleware,
} from './middleware/errorMiddleware';
import { createFeedRouter } from './routes/feedRouter';
import { createHealthRouter } from './routes/healthRouter';
import { createItemRouter } from './routes/itemRouter';
import { createPodcastRouter } from './routes/podcastRouter';
import { createSearchRouter } from './routes/searchRouter';
import { createSourceRouter } from './routes/sourceRouter';
import type { ApiDependencies } from './types';

export function createApp(deps: ApiDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  // Behind a proxy — Supabase and any host — the client IP is in a header.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      // An empty allow-list reflects the caller, which is what local Expo
      // development needs. Production sets CORS_ORIGINS explicitly.
      origin: deps.config.corsOrigins.length > 0 ? deps.config.corsOrigins : true,
      methods: ['GET', 'POST'],
    })
  );
  app.use(compression());
  app.use(pinoHttp({ logger: deps.logger }));
  app.use(express.json({ limit: '100kb' }));
  app.use(
    rateLimit({
      windowMs: deps.config.rateLimitWindowMs,
      max: deps.config.rateLimitMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    })
  );

  app.use('/health', createHealthRouter(deps));
  app.use('/v1/feed', createFeedRouter(deps));
  app.use('/v1/items', createItemRouter(deps));
  app.use('/v1/sources', createSourceRouter(deps));
  app.use('/v1/podcasts', createPodcastRouter(deps));
  app.use('/v1/search', createSearchRouter(deps));

  app.use(notFoundMiddleware);
  app.use(createErrorMiddleware(deps.logger));

  return app;
}
