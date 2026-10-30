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
    province: row.province,
    category: row.category,
    createdAt: row.created_at.toISOString(),
  };
}

const SELECT_COLUMNS = `
  id, name, type, content_type, feed_url, site_url, logo_url,
  description, province, category, is_active, created_at
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

/**
 * Directory search over source names and descriptions.
 *
 * This is deliberately separate from item search: channel and show names are
 * not stored on every item, so they would otherwise never match a query.
 * Videos sort ahead of podcasts and articles so a search for "news" surfaces
 * the channels a reader can actually watch.
 */
export async function searchSources(
  db: Database,
  term: string,
  limit: number
): Promise<Source[]> {
  const result = await db.query<SourceRow>(
    `SELECT ${SELECT_COLUMNS} FROM sources
     WHERE name ILIKE '%' || $1 || '%'
       OR coalesce(description, '') ILIKE '%' || $1 || '%'
     ORDER BY
       CASE content_type
         WHEN 'video' THEN 0
         WHEN 'podcast_episode' THEN 1
         ELSE 2
       END,
       name ASC
     LIMIT $2`,
    [term, limit]
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
  province?: Source['province'];
  category?: Source['category'];
}

/** Add or refresh a source. Re-running with the same `feed_url` is a no-op. */
export async function upsertSource(
  db: Database,
  input: UpsertSourceInput
): Promise<Source> {
  const result = await db.query<SourceRow>(
    `INSERT INTO sources
       (name, type, content_type, feed_url, site_url, logo_url, description, province, category)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (feed_url) DO UPDATE SET
       name = EXCLUDED.name,
       type = EXCLUDED.type,
       content_type = EXCLUDED.content_type,
       site_url = COALESCE(EXCLUDED.site_url, sources.site_url),
       logo_url = COALESCE(EXCLUDED.logo_url, sources.logo_url),
       description = COALESCE(EXCLUDED.description, sources.description),
       province = COALESCE(EXCLUDED.province, sources.province),
       category = COALESCE(EXCLUDED.category, sources.category)
     RETURNING ${SELECT_COLUMNS}`,
    [
      input.name,
      input.type,
      input.contentType,
      input.feedUrl,
      input.siteUrl ?? null,
      input.logoUrl ?? null,
      input.description ?? null,
      input.province ?? null,
      input.category ?? null,
    ]
  );

  const row = result.rows[0];
  if (!row) throw new Error('upsertSource returned no row');
  return mapSource(row);
}
