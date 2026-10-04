/**
 * Migration runner.
 *
 * Uses `DATABASE_URL_DIRECT`: a pooled connection does not hold a session long
 * enough for migrations. Usage: `pnpm --filter @newzcrime/db migrate [up|down] [count]`.
 */

import 'dotenv/config';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runner } from 'node-pg-migrate';

async function main(): Promise<void> {
  const direction = (process.argv[2] ?? 'up') as 'up' | 'down';
  if (direction !== 'up' && direction !== 'down') {
    throw new Error(`Unknown direction "${direction}". Use "up" or "down".`);
  }

  const databaseUrl =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL_DIRECT is not set. Copy .env.example to .env first.'
    );
  }

  const countArgument = process.argv[3];
  const count = countArgument ? Number(countArgument) : undefined;
  if (countArgument && !Number.isInteger(count)) {
    throw new Error(`Count "${countArgument}" is not an integer.`);
  }

  const here = dirname(fileURLToPath(import.meta.url));

  await runner({
    databaseUrl,
    dir: resolve(here, '../migrations'),
    direction,
    count,
    migrationsTable: 'pgmigrations',
    verbose: true,
  });
}

main().catch((error: unknown) => {
  console.error('[db] migrate failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
