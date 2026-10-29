/**
 * Connection doctor.
 *
 * Answers the question a blank feed actually asks: is the app talking to the
 * database that has the data in it? It prints the host, whether TLS is on, how
 * far migrations have got and how many rows each table holds — never the
 * password or the full connection string.
 *
 * Usage:
 *   pnpm --filter @newzcrime/db verify
 *   pnpm --filter @newzcrime/db verify --strict   # non-zero when empty
 *
 * Reads `DATABASE_URL_DIRECT` first: that is the connection migrations and the
 * ingester use, so it is the one whose contents matter.
 */

import dotenv from 'dotenv';

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from 'pg';

import { connectionNeedsTls } from '../src/database';

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env'),
});

const strict = process.argv.includes('--strict');

interface Counts {
  sources: number;
  activeSources: number;
  podcasts: number;
  items: number;
  latest: Date | null;
}

function describeTarget(connectionString: string): {
  host: string;
  port: string;
  database: string;
  tls: boolean;
} {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, '') || '(default)',
      tls: connectionNeedsTls(connectionString),
    };
  } catch {
    return { host: '(unparsable URL)', port: '?', database: '?', tls: false };
  }
}

function line(label: string, value: string): void {
  console.log(`  ${label.padEnd(14)} ${value}`);
}

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL_DIRECT is not set. Copy .env.example to .env and paste the Supabase connection string.'
    );
  }

  const target = describeTarget(connectionString);
  console.log('[db] connection');
  line('host', `${target.host}:${target.port}`);
  line('database', target.database);
  line('tls', target.tls ? 'on' : 'off (local)');

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
    ssl: target.tls ? { rejectUnauthorized: false } : undefined,
  });

  const started = Date.now();
  await client.connect();
  console.log(`[db] connected in ${Date.now() - started}ms`);

  try {
    const version = await client.query<{ version: string }>('select version()');
    line('server', version.rows[0]?.version.split(' ').slice(0, 2).join(' ') ?? 'unknown');

    const migrationTable = await client.query<{ count: string }>(
      `select count(*)::text as count
         from information_schema.tables
        where table_schema = 'public' and table_name = 'pgmigrations'`
    );

    if (migrationTable.rows[0]?.count === '0') {
      throw new Error(
        'The schema is missing. Run `pnpm --filter @newzcrime/db migrate` first.'
      );
    }

    const applied = await client.query<{ name: string; run_on: Date }>(
      'select name, run_on from pgmigrations order by run_on desc limit 1'
    );
    line(
      'migrations',
      applied.rows[0]
        ? `${applied.rows[0].name} (${applied.rows[0].run_on.toISOString()})`
        : 'none applied'
    );

    const counts = await client.query<Counts>(
      `select
         (select count(*)::int from sources) as sources,
         (select count(*)::int from sources where is_active) as "activeSources",
         (select count(*)::int from sources where content_type = 'podcast_episode') as podcasts,
         (select count(*)::int from content_items) as items,
         (select max(published_at) from content_items) as latest`
    );

    const row = counts.rows[0];
    if (!row) throw new Error('Could not read table counts.');

    console.log('[db] contents');
    line('sources', `${row.sources} (${row.activeSources} active, ${row.podcasts} podcasts)`);
    line('items', String(row.items));
    line('latest item', row.latest ? row.latest.toISOString() : '—');

    if (row.sources === 0) {
      console.warn(
        '\n[db] The source list is empty. Run `pnpm --filter @newzcrime/db migrate up` to seed it.'
      );
      process.exitCode = 1;
      return;
    }

    if (row.items === 0) {
      console.warn(
        '\n[db] Connected, but no stories have been collected yet.\n' +
          '     Run one ingest against this database:\n' +
          '       DATABASE_URL_DIRECT="<this URL>" pnpm --filter @newzcrime/worker ingest\n' +
          '     The GitHub Action needs the same value in the DATABASE_URL_DIRECT secret.'
      );
      if (strict) process.exitCode = 1;
      return;
    }

    const newest = row.latest ? Date.now() - row.latest.getTime() : null;
    if (newest !== null && newest > 48 * 60 * 60 * 1000) {
      console.warn(
        '\n[db] The newest story is more than 48 hours old. Check the ingest workflow.'
      );
    }

    console.log('\n[db] Ready: the API will return stories from this database.');
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    '[db] verify failed:',
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});
