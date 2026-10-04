/**
 * Reads and writes for the `content_items` table.
 *
 * De-duplication is scoped to a source through the unique constraint on
 * `(source_id, external_id)`: the same wire story carried by three outlets is
 * three legitimate rows.
 */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';

import { decodeCursor, encodeCursor } from '../cursor';
import type {
  ContentItemInput,
  ContentItemRow,
  Database,
  ItemPageQuery,
  SearchQuery,
} from '../types';

/** Rows per `INSERT` statement. Keeps the parameter count well under the limit. */
const INSERT_CHUNK_SIZE = 100;

const SELECT_COLUMNS = `
  id, source_id, type, topic, external_id, title, url, excerpt, image_url,
  author, published_at, created_at
`;

export function mapContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    sourceId: row.source_id,
    type: row.type,
    topic: row.topic,
    externalId: row.external_id,
    title: row.title,
    url: row.url,
    excerpt: row.excerpt,
    imageUrl: row.image_url,
    author: row.author,
    publishedAt: row.published_at.toISOString(),
  };
}

function toPage(rows: ContentItemRow[], limit: number): Paginated<ContentItem> {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    items: page.map(mapContentItem),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            publishedAt: last.published_at.toISOString(),
            id: last.id,
          })
        : null,
  };
}

export interface UpsertItemsResult {
  total: number;
  inserted: number;
}

/**
 * Insert items, updating the mutable fields when the item already exists.
 *
 * `xmax = 0` distinguishes a fresh insert from an update, so the caller can
 * report how much of the run was new.
 */
export async function upsertItems(
  db: Database,
  source: Source,
  items: ReadonlyArray<ContentItemInput>
): Promise<UpsertItemsResult> {
  let inserted = 0;

  for (let offset = 0; offset < items.length; offset += INSERT_CHUNK_SIZE) {
    const chunk = items.slice(offset, offset + INSERT_CHUNK_SIZE);
    const values: unknown[] = [];

    const tuples = chunk.map((item, index) => {
      values.push(
        source.id,
        source.contentType,
        item.topic,
        item.externalId,
        item.title,
        item.url,
        item.excerpt,
        item.imageUrl,
        item.author,
        item.publishedAt
      );

      const start = index * 10;
      const placeholders = Array.from(
        { length: 10 },
        (_unused, column) => `$${start + column + 1}`
      ).join(', ');
      return `(${placeholders})`;
    });

    const result = await db.query<{ inserted: boolean }>(
      `INSERT INTO content_items
         (source_id, type, topic, external_id, title, url, excerpt, image_url, author, published_at)
       VALUES ${tuples.join(', ')}
       ON CONFLICT (source_id, external_id) DO UPDATE SET
         title = EXCLUDED.title,
         url = EXCLUDED.url,
         excerpt = EXCLUDED.excerpt,
         image_url = EXCLUDED.image_url,
         author = EXCLUDED.author,
         published_at = EXCLUDED.published_at,
         topic = EXCLUDED.topic
       RETURNING (xmax = 0) AS inserted`,
      values
    );

    inserted += result.rows.filter((row) => row.inserted).length;
  }

  return { total: items.length, inserted };
}

export async function listItems(
  db: Database,
  query: ItemPageQuery
): Promise<Paginated<ContentItem>> {
  const cursor = decodeCursor(query.cursor);

  const result = await db.query<ContentItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM content_items
     WHERE ($1::text IS NULL OR topic = $1)
       AND ($2::uuid IS NULL OR source_id = $2)
       AND ($3::boolean IS TRUE OR type <> 'podcast_episode')
       AND ($4::timestamptz IS NULL OR (published_at, id) < ($4::timestamptz, $5::uuid))
     ORDER BY published_at DESC, id DESC
     LIMIT $6`,
    [
      query.topic ?? null,
      query.sourceId ?? null,
      query.includePodcasts ?? false,
      cursor?.publishedAt ?? null,
      cursor?.id ?? null,
      query.limit + 1,
    ]
  );

  return toPage(result.rows, query.limit);
}

export async function getItemById(
  db: Database,
  id: string
): Promise<ContentItem | null> {
  const result = await db.query<ContentItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM content_items WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  return row ? mapContentItem(row) : null;
}

export async function listItemsBySource(
  db: Database,
  sourceId: string,
  query: ItemPageQuery
): Promise<Paginated<ContentItem>> {
  const cursor = decodeCursor(query.cursor);

  const result = await db.query<ContentItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM content_items
     WHERE source_id = $1
       AND ($2::timestamptz IS NULL OR (published_at, id) < ($2::timestamptz, $3::uuid))
     ORDER BY published_at DESC, id DESC
     LIMIT $4`,
    [
      sourceId,
      cursor?.publishedAt ?? null,
      cursor?.id ?? null,
      query.limit + 1,
    ]
  );

  return toPage(result.rows, query.limit);
}

export async function searchItems(
  db: Database,
  query: SearchQuery
): Promise<Paginated<ContentItem>> {
  const cursor = decodeCursor(query.cursor);

  const result = await db.query<ContentItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM content_items
     WHERE (
       search_vector @@ websearch_to_tsquery('english', $1)
       OR title ILIKE '%' || $1 || '%'
     )
       AND ($2::timestamptz IS NULL OR (published_at, id) < ($2::timestamptz, $3::uuid))
     ORDER BY published_at DESC, id DESC
     LIMIT $4`,
    [
      query.query,
      cursor?.publishedAt ?? null,
      cursor?.id ?? null,
      query.limit + 1,
    ]
  );

  return toPage(result.rows, query.limit);
}

/** Total stored items, for the health endpoint and local checks. */
export async function countItems(db: Database): Promise<number> {
  const result = await db.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM content_items'
  );
  return Number(result.rows[0]?.count ?? 0);
}
