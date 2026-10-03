/**
 * Migration runner, delegating to node-pg-migrate against
 * `DATABASE_URL_DIRECT`. The pooled URL does not hold a session long enough for
 * migrations.
 *
 * TODO: load migrations, forward CLI arguments and exit non-zero on failure.
 */

const direction = (process.argv[2] ?? 'up') as 'up' | 'down';

console.log(`[db] migrate ${direction}: not implemented yet`);
