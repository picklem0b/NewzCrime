/**
 * Database access layer. Exposes one pooled `pg` handle; migrations run through
 * node-pg-migrate (see `scripts/migrate.ts`).
 *
 * TODO: construct the pool, map errors and wire the health check.
 */

import type { Database, DatabaseConfig } from './types';

export function createDatabase(config: DatabaseConfig): Database {
  void config;
  throw new Error('createDatabase is not implemented yet');
}
