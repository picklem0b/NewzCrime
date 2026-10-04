/**
 * Reads and writes for the `sources` table.
 *
 * One repository serves the API and the worker, so both see identical queries.
 */

import type { ContentType, Source, SourceType } from '@newzcrime/shared';

import type { Database, SourceRow } from '../types';

export function mapSource(row: SourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    contentType: row.content_type,
    feedUrl: row.feed_url,
    siteUrl: row.site_url,
    logoUrl: row.logo_url,
    description: row.description,
    createdAt: row.created_at.toISOString(),
  };
}

const SELECT_COLUMNS = `
  id, name, type, content_type, feed_url, site_url, logo_url,
  description, is_active, created_at
`;

export async function listSources(db: Database): Promise<Source[]> {
  const result = await db.query<SourceRow>(
    `SELECT ${SELECT_COLUMNS} FROM sources ORDER BY name ASC`
  );
  return result.rows.map(mapSource);
}

/** Active sources only — what the ingest scheduler fans out over. */
export async function listActiveSources(db: Database): Promise<Source[]> {
  const result = await db.query<SourceRow>(
    `SELECT ${SELECT_COLUMNS} FROM sources WHERE is_active ORDER BY name ASC`
  );
  return result.rows.map(mapSource);
}

export async function getSourceById(
  db: Database,
  id: string
): Promise<Source | null> {
  const result = await db.query<SourceRow>(
    `SELECT ${SELECT_COLUMNS} FROM sources WHERE id = $1`,
    [id]
  );
  return result.rows[0] ? mapSource(result.rows[0]) : null;
}

export interface UpsertSourceInput {
  name: string;
  type: SourceType;
  contentType: ContentType;
  feedUrl: string;
  siteUrl?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

/** Add or refresh a source. Re-running with the same `feed_url` is a no-op. */
export async function upsertSource(
  db: Database,
  input: UpsertSourceInput
): Promise<Source> {
  const result = await db.query<SourceRow>(
    `INSERT INTO sources (name, type, content_type, feed_url, site_url, logo_url, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (feed_url) DO UPDATE SET
       name = EXCLUDED.name,
       type = EXCLUDED.type,
       content_type = EXCLUDED.content_type,
       site_url = COALESCE(EXCLUDED.site_url, sources.site_url),
       logo_url = COALESCE(EXCLUDED.logo_url, sources.logo_url),
       description = COALESCE(EXCLUDED.description, sources.description)
     RETURNING ${SELECT_COLUMNS}`,
    [
      input.name,
      input.type,
      input.contentType,
      input.feedUrl,
      input.siteUrl ?? null,
      input.logoUrl ?? null,
      input.description ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) throw new Error('upsertSource returned no row');
  return mapSource(row);
}
