/**
 * Adapter registry.
 *
 * One place builds every adapter, keyed by `sources.type`, so the long-running
 * worker and the one-shot ingest script cannot drift apart. Supporting a new
 * kind of source means adding one entry here and nothing else.
 */

import type { SourceAdapter, WorkerConfig } from '../types';
import { createRssAdapter } from './rssAdapter';
import { createSafliiAdapter } from './safliiAdapter';

export function createAdapters(config: WorkerConfig): SourceAdapter[] {
  return [
    createRssAdapter({
      userAgent: config.userAgent,
      timeoutMs: config.fetchTimeoutMs,
    }),
    createSafliiAdapter({
      userAgent: config.userAgent,
      timeoutMs: config.fetchTimeoutMs,
    }),
  ];
}

export { createRssAdapter, createSafliiAdapter };
