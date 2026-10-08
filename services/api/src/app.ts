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
import { createAppRouter } from './routes/appRouter';
import { createFeedRouter } from './routes/feedRouter';
import { createHealthRouter } from './routes/healthRouter';
import { createItemRouter } from './routes/itemRouter';
import { createPodcastRouter } from './routes/podcastRouter';
import { createSearchRouter } from './routes/searchRouter';
import { createSourceRouter } from './routes/sourceRouter';
import type { ApiDependencies } from './types';

export function createApp(deps: ApiDependencies): Express {
  const app = express();
  const { corsOrigins, nodeEnv, trustProxy } = deps.config;
  const isProduction = nodeEnv === 'production';

  app.disable('x-powered-by');

  // Only trust a proxy that is actually in front of us. Trusting one that is
  // not lets a caller set `X-Forwarded-For` and get a fresh rate-limit bucket
  // per request, which removes the limit without touching a config value.
  app.set('trust proxy', trustProxy);

  app.use(helmet());
  app.use(
    cors({
      // An explicit list always wins. With none, production blocks cross-origin
      // reads rather than reflecting whatever origin asks, so a deployment that
      // forgets CORS_ORIGINS is closed rather than open. Development reflects,
      // because the Expo dev server is a different origin on the same machine.
      origin:
        corsOrigins.length > 0 ? corsOrigins : isProduction ? false : true,
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
  app.use('/v1/app', createAppRouter());
  app.use('/v1/feed', createFeedRouter(deps));
  app.use('/v1/items', createItemRouter(deps));
  app.use('/v1/sources', createSourceRouter(deps));
  app.use('/v1/podcasts', createPodcastRouter(deps));
  app.use('/v1/search', createSearchRouter(deps));

  app.use(notFoundMiddleware);
  app.use(createErrorMiddleware(deps.logger));

  return app;
}
