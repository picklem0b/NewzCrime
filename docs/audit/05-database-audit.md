# 05 — Database Audit

Scope: `packages/db` (pool, repositories, cursor codec, migrations).

## Schema

Two tables, six migrations (all additive except the initial create).

### `sources`
Outlet or show. `type` drives which worker adapter ingests it
(`rss` / `podcast_index` / `saflii`); `content_type` is the kind every item
from that source is stored as.

### `content_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `source_id` | uuid NOT NULL | `REFERENCES sources(id) ON DELETE CASCADE` |
| `type` | text NOT NULL | `CHECK (type IN ('article','court_ruling','podcast_episode'))` |
| `topic` | text | `CHECK (topic IN ('court','crime','politics','world'))`, nullable |
| `external_id` | text NOT NULL | source-scoped id |
| `title` / `url` | text NOT NULL | |
| `excerpt` / `image_url` / `author` | text | nullable |
| `audio_url` | text | added by migration `…003` for podcast enclosures |
| `published_at` | timestamptz NOT NULL | sort key |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `search_vector` | tsvector GENERATED STORED | from `title || excerpt`, `english` |

Constraints worth noting:

- `UNIQUE (source_id, external_id)` is what makes ingest idempotent and what
  `ON CONFLICT` targets. It is **source-scoped on purpose**: the same wire
  story carried by three outlets is three legitimate rows.
- The `CHECK` constraints mirror the shared `ContentType` / `ItemTopic`
  unions, so the database rejects a value the application layer has no type
  for.

## Indexes — and why each exists

| Index | Definition | Justifies |
|---|---|---|
| `content_items_published_at_idx` | `(published_at DESC, id DESC)` | the feed's `ORDER BY published_at DESC, id DESC` and the `(published_at, id) < (…,…)` keyset predicate |
| `content_items_source_published_idx` | `(source_id, published_at DESC, id DESC)` | `listItemsBySource` — filter by source then same order |
| `content_items_search_idx` | GIN `(search_vector)` | `search_vector @@ websearch_to_tsquery(...)` |
| `content_items_title_trgm_idx` | GIN `(title gin_trgm_ops)` | the `title ILIKE '%…%'` fallback; full-text does not match prefixes |
| `content_items_source_external_unique` | UNIQUE `(source_id, external_id)` | idempotent upsert target + de-dup guarantee |

No index was added speculatively and none is unused: every index maps to a
predicate that appears in `contentItemRepository`.

## Queries

All reads are parameterised with `$n` placeholders (`rg` found **no** string
interpolation of values into SQL). The only literal SQL is `select 1` for the
health probe.

**Feed / list** (`listItems`) — one statement:

```sql
WHERE ($1::text IS NULL OR topic = $1)
  AND ($2::uuid IS NULL OR source_id = $2)
  AND ($3::boolean IS TRUE OR type <> 'podcast_episode')
  AND ($4::timestamptz IS NULL OR (published_at, id) < ($4::timestamptz, $5::uuid))
ORDER BY published_at DESC, id DESC
LIMIT $6
```

- Casts on the placeholders (`$1::text`, `$2::uuid`, …) let one plan serve
  every filter combination without re-preparing per parameter type.
- `LIMIT limit + 1` is the `hasMore` probe — the extra row is dropped in
  `toPage`, so no `COUNT(*)` is needed per page.

**Search** (`searchItems`) — full-text OR trigram `ILIKE`, plus the same
keyset predicate. Note the `ILIKE '%' || $1 || '%'` pattern cannot use the
btree path, which is exactly why the trigram index exists.

**Upsert** — chunked at 100 rows × 11 columns = 1100 bound parameters per
statement, comfortably under the 65535 limit. `RETURNING (xmax = 0) AS
inserted` distinguishes fresh inserts from updates so the job can report new
counts.

## Cursor codec

`encodeCursor`/`decodeCursor` (base64url of `publishedAt|id`).
`decodeCursor` returns `null` for anything malformed (missing separator,
empty parts, unparseable date, non-base64), so a bad cursor degrades to a
first page rather than throwing. Keyset pagination is used instead of
`OFFSET` because items are inserted continuously and offset pages drift.

## Migrations

Six, ordered by timestamp prefix; the runner is
`packages/db/scripts/migrate.ts`. They are additive, and `003`/`004` add the
audio column and the SAFLII source type — the pattern for a safe forward
migration here is "add column / add allowed value", not "rewrite".

## Issues

| # | Issue | Severity | Action |
|---|---|---|---|
| D1 | `toPage` returns the *first* `limit` rows; correctness depends on `hasMore = rows.length > limit`, so `LIMIT limit+1` must never be reduced | Low (documented) | Recorded |
| D2 | No index on `created_at`; nothing queries by it (only the count for health) | Info | None needed |
| D3 | Query plans not measured against production-scale data in this pass — Postgres was unavailable in the audit environment | Medium | Recorded, see `09` |

## Verdict

The schema is normalised, constrained, and indexed precisely to its access
patterns; ingestion is idempotent by construction; reads are
cursor-paginated and fully parameterised. The remaining gap is empirical:
plan verification at volume, which needs a live database.
