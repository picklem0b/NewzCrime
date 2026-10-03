/**
 * Express application factory.
 *
 * Separated from the listener so tests can import the app without binding a
 * port, and so middleware order is defined in one place.
 *
 * TODO: security, CORS, compression, logging, JSON parsing and rate limiting,
 * then the `/v1` routers and a terminal error handler.
 */

import type { Express } from 'express';
import type { ApiConfig } from './types';

export function createApp(config: ApiConfig): Express {
  void config;
  throw new Error('createApp is not implemented yet');
}
