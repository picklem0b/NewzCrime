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
  ItemBodyRow,
  ItemPageQuery,
  SearchQuery,
} from '../types';

/** Rows per `INSERT` statement. Keeps the parameter count well under the limit. */
const INSERT_CHUNK_SIZE = 100;

/** Values bound per row in the insert above. */
const COLUMNS_PER_ROW = 13;

const SELECT_COLUMNS = `
  id, source_id, type, topic, external_id, title, url, excerpt, image_url,
  audio_url, author, published_at, view_count, like_count, created_at
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
    audioUrl: row.audio_url,
    author: row.author,
    publishedAt: row.published_at.toISOString(),
    viewCount: row.view_count === null ? null : Number(row.view_count),
    likeCount: row.like_count,
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
        item.audioUrl,
        item.author,
        item.publishedAt,
        item.viewCount ?? null,
        item.likeCount ?? null
      );

      const start = index * COLUMNS_PER_ROW;
      const placeholders = Array.from(
        { length: COLUMNS_PER_ROW },
        (_unused, column) => `$${start + column + 1}`
      ).join(', ');
      return `(${placeholders})`;
    });

    const result = await db.query<{ inserted: boolean }>(
      `INSERT INTO content_items
         (source_id, type, topic, external_id, title, url, excerpt, image_url, audio_url, author, published_at, view_count, like_count)
       VALUES ${tuples.join(', ')}
       ON CONFLICT (source_id, external_id) DO UPDATE SET
         title = EXCLUDED.title,
         url = EXCLUDED.url,
         excerpt = EXCLUDED.excerpt,
         image_url = EXCLUDED.image_url,
         audio_url = EXCLUDED.audio_url,
         author = EXCLUDED.author,
         published_at = EXCLUDED.published_at,
         topic = EXCLUDED.topic,
         view_count = EXCLUDED.view_count,
         like_count = EXCLUDED.like_count
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
       AND ($6::text IS NULL OR type = $6)
       AND ($7::boolean IS TRUE OR type <> 'video')
       AND ($8::uuid[] IS NULL OR source_id = ANY($8::uuid[]))
     ORDER BY published_at DESC, id DESC
     LIMIT $9`,
    [
      query.topic ?? null,
      query.sourceId ?? null,
      query.includePodcasts ?? false,
      cursor?.publishedAt ?? null,
      cursor?.id ?? null,
      query.contentType ?? null,
      query.includeVideos ?? false,
      query.sourceIds && query.sourceIds.length > 0 ? query.sourceIds : null,
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
  const ascending = query.sort === 'oldest';
  const direction = ascending ? 'ASC' : 'DESC';
  const comparison = ascending ? '>' : '<';

  const result = await db.query<ContentItemRow>(
    `SELECT ${SELECT_COLUMNS} FROM content_items
     WHERE (
       search_vector @@ websearch_to_tsquery('english', $1)
       OR title ILIKE '%' || $1 || '%'
     )
       AND ($2::text IS NULL OR type = $2)
       AND ($3::text IS NULL OR topic = $3)
       AND ($4::uuid IS NULL OR source_id = $4)
       AND ($5::timestamptz IS NULL OR published_at >= $5)
       AND ($6::timestamptz IS NULL OR published_at <= $6)
       AND ($7::timestamptz IS NULL OR (published_at, id) ${comparison} ($7::timestamptz, $8::uuid))
       AND ($9::uuid[] IS NULL OR source_id = ANY($9::uuid[]))
     ORDER BY published_at ${direction}, id ${direction}
     LIMIT $10`,
    [
      query.query,
      query.type ?? null,
      query.topic ?? null,
      query.sourceId ?? null,
      query.from ?? null,
      query.to ?? null,
      cursor?.publishedAt ?? null,
      cursor?.id ?? null,
      query.sourceIds && query.sourceIds.length > 0 ? query.sourceIds : null,
      query.limit + 1,
    ]
  );

  return toPage(result.rows, query.limit);
}

/** Cached full text for one item, plus whether extraction was attempted. */
export interface StoredItemBody {
  body: string | null;
  fetchedAt: Date | null;
}

/** Read the cached body columns without pulling them into every feed query. */
export async function getItemBody(
  db: Database,
  itemId: string
): Promise<StoredItemBody | null> {
  const result = await db.query<ItemBodyRow>(
    'SELECT body, body_fetched_at FROM content_items WHERE id = $1',
    [itemId]
  );
  const row = result.rows[0];
  if (!row) return null;

  return { body: row.body, fetchedAt: row.body_fetched_at };
}

/**
 * Store an extraction result, successful or not.
 *
 * `body_fetched_at` is set on failure too, so a page that will never yield
 * text (paywall, login wall, removed story) is not refetched on every open.
 */
export async function saveItemBody(
  db: Database,
  itemId: string,
  body: string | null
): Promise<void> {
  await db.query(
    `UPDATE content_items
     SET body = $2, body_fetched_at = now()
     WHERE id = $1`,
    [itemId, body]
  );
}

/** Total stored items, for the health endpoint and local checks. */
export async function countItems(db: Database): Promise<number> {
  const result = await db.query<{ count: string }>(
    'SELECT count(*)::text AS count FROM content_items'
  );
  return Number(result.rows[0]?.count ?? 0);
}
