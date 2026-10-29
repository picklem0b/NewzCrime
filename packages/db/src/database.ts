/**
 * Database access layer. Exposes one pooled `pg` handle; migrations run through
 * node-pg-migrate (see `scripts/migrate.ts`).
 */

import { Pool } from 'pg';

import type { Database, DatabaseConfig } from './types';

/** Hosts that are reached over a loopback or a private network, not the internet. */
const LOCAL_HOST =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|::1|\[::1\]|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|host\.docker\.internal)$/i;

/**
 * Whether a connection string points at a host that needs TLS.
 *
 * Supabase (and every other managed Postgres) presents a certificate signed by
 * a public CA, and refuses plaintext. Local Postgres from docker-compose does
 * not speak TLS at all, so forcing it on would break development. The URL
 * decides: `sslmode=require` wins outright, a private host is plaintext, and
 * anything else on the network gets TLS.
 */
export function connectionNeedsTls(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get('sslmode')?.toLowerCase();

    if (mode === 'disable' || mode === 'allow') return false;
    if (mode === 'require' || mode === 'verify-ca' || mode === 'verify-full') {
      return true;
    }

    return !LOCAL_HOST.test(url.hostname);
  } catch {
    // An unparsable URL is passed to `pg` as-is; let it produce the error.
    return false;
  }
}

export function createDatabase(config: DatabaseConfig): Database {
  const useTls = config.ssl ?? connectionNeedsTls(config.connectionString);

  const pool = new Pool({
    connectionString: config.connectionString,
    max: config.maxConnections ?? 10,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10_000,
    // Supabase's pooler certificate is valid, but the chain is not always in a
    // bare Node image; `rejectUnauthorized: false` is the documented setting
    // for node-postgres against Supabase.
    ssl: useTls ? { rejectUnauthorized: false } : undefined,
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
