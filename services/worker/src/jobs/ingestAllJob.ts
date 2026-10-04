/**
 * Fan-out job.
 *
 * Runs on the scheduler cron: reads the active sources and enqueues one ingest
 * job per source. Sources are read at fan-out time, so a source added or
 * deactivated between runs is picked up without restarting the worker.
 */

import type { Database } from '@newzcrime/db';
import { listActiveSources } from '@newzcrime/db';
import type { Logger } from 'pino';

import { INGEST_SOURCE_QUEUE } from '../queue/queue';

/** The slice of pg-boss this job needs, kept narrow so it is easy to fake. */
export interface JobSender {
  send(name: string, data: object): Promise<string | null>;
}

export interface IngestAllDeps {
  db: Database;
  sender: JobSender;
  logger: Logger;
}

export function createIngestAllJob(deps: IngestAllDeps) {
  return async (): Promise<{ queued: number; total: number }> => {
    const sources = await listActiveSources(deps.db);

    let queued = 0;
    for (const source of sources) {
      const jobId = await deps.sender.send(INGEST_SOURCE_QUEUE, {
        sourceId: source.id,
      });
      if (jobId) queued += 1;
    }

    deps.logger.info(
      { queued, total: sources.length },
      'ingest fan-out complete'
    );

    return { queued, total: sources.length };
  };
}
