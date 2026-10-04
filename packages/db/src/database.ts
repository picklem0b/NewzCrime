/**
 * Database access layer. Exposes one pooled `pg` handle; migrations run through
 * node-pg-migrate (see `scripts/migrate.ts`).
 */

import { Pool } from 'pg';

import type { Database, DatabaseConfig } from './types';

export function createDatabase(config: DatabaseConfig): Database {
  const pool = new Pool({
    connectionString: config.connectionString,
    max: config.maxConnections ?? 10,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10_000,
    ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
  });

  // A pooled connection can fail while idle. Without this listener `pg` emits
  // on an EventEmitter with no handler, which takes the process down.
  pool.on('error', (error: Error) => {
    config.onError?.(error);
  });

  return {
    pool,

    query(text, params) {
      return pool.query(text, params as unknown[]);
    },

    async withClient(run) {
      const client = await pool.connect();
      try {
        return await run(client);
      } finally {
        client.release();
      }
    },

    async healthCheck() {
      try {
        await pool.query('select 1');
        return true;
      } catch {
        return false;
      }
    },

    close() {
      return pool.end();
    },
  };
}
