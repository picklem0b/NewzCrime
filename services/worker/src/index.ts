/**
 * Ingestion worker entrypoint.
 *
 * TODO: start pg-boss, register the scheduler and per-source job handlers.
 */

import 'dotenv/config';

import { loadWorkerConfig } from './config/env';

const config = loadWorkerConfig();

console.log(`[worker] scaffold ready — cron: ${config.ingestCron}`);
