/**
 * Database contracts.
 *
 * Re-uses the concrete `pg` types rather than redeclaring them, so callers keep
 * full row typing without this file knowing the schema.
 */

import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/** Connection settings, mapped from `DATABASE_URL` / `DATABASE_URL_DIRECT`. */
export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean;
}

/** The pooled database handle passed around by dependency injection. */
export interface Database {
  readonly pool: Pool;
  /** Run a parameterised query and get exactly-typed rows back. */
  query<TRow extends QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<QueryResult<TRow>>;
  /** Check out a client for a multi-statement transaction. */
  withClient<TResult>(
    run: (client: PoolClient) => Promise<TResult>
  ): Promise<TResult>;
  /** Cheap readiness probe for `/health`. */
  healthCheck(): Promise<boolean>;
  /** Drain the pool on shutdown. */
  close(): Promise<void>;
}
