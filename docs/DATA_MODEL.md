# Data model

Two application tables. Migrations live in `packages/db/migrations` and are run
with `pnpm --filter @newzcrime/db migrate up`.

## `sources`

One row per news outlet or podcast show. Both are modelled in one table because
they behave the same way: a name, a URL to poll and items that belong to it.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | `gen_random_uuid()` |
| `name` | text, not null | Display name |
| `type` | text, not null | How it is ingested: `rss` or `podcast_index` |
| `content_type` | text, not null | What its items are: `article`, `court_ruling` or `podcast_episode` |
| `feed_url` | text, not null, unique | RSS/Atom URL the worker polls |
| `site_url` | text | Publisher's site |
| `logo_url` | text | |
| `description` | text | |
| `is_active` | boolean, not null | Lets a broken source be disabled without deleting its items |
| `created_at` | timestamptz, not null | |

`type` and `content_type` are separate because they answer different questions:
how the source is fetched, and what the fetched items are. A podcast show is
ingested as `rss` but produces `podcast_episode` rows.

## `content_items`

One row per article, judgment or podcast episode.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `source_id` | uuid, not null, references `sources(id)` | Deletes with the source |
| `type` | text, not null | `article`, `court_ruling` or `podcast_episode` |
| `topic` | text | `court`, `crime`, `politics` or `world`; `null` when nothing matched |
| `external_id` | text, not null | Stable id from the feed |
| `title` | text, not null | |
| `url` | text, not null | Link to the publisher |
| `excerpt` | text | Summary only; never the full article body |
| `image_url` | text | |
| `audio_url` | text | Podcast enclosure. `null` for anything without playable audio |
| `author` | text | |
| `published_at` | timestamptz, not null | Stored in UTC |
| `created_at` | timestamptz, not null | |
| `search_vector` | tsvector, generated | `to_tsvector` over title and excerpt |

**De-duplication.** Unique constraint on `(source_id, external_id)`. When a feed
omits an id, the adapter derives one from a hash of the normalised URL.
Deduplication is scoped to a single source: the same wire story on three outlets
is three legitimate rows.

**Topic classification.** A keyword heuristic runs at ingest and stores one
topic per item. It is advisory: an untagged item still appears under `all`.
Storing it keeps the feed filter an indexed lookup rather than a scan.

**Indexes.**

- `(published_at desc, id desc)` for feed paging.
- `(source_id, published_at desc, id desc)` for source pages.
- GIN on `search_vector` for word queries.
- GIN on `title` with `gin_trgm_ops` for the prefix fallback.

## Job queue

pg-boss owns the `pgboss` schema and its own tables. It must not be modified by
application migrations. The worker creates the `ingest-all` and `ingest-source`
queues on startup and connects on the direct Postgres port; see
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Accounts

Authentication is a later phase. When it arrives, user-owned tables (`saved`
items, follows) carry a nullable `user_id` referencing the identity provider's
user table. Until then, bookmarks and settings are stored on the device and no
account tables exist.
