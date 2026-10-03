/**
 * API entrypoint.
 *
 * TODO: build the app, listen on `API_PORT` and handle graceful shutdown.
 */

import 'dotenv/config';

import { loadApiConfig } from './config/env';

const config = loadApiConfig();

console.log(`[api] scaffold ready — would listen on :${config.port}`);
