# Data model

Only two application tables are required for the first release. The schema is
not written yet; this document is the agreed shape.

## `sources`

One row per news outlet or podcast show. Both are modelled in one table because
they behave the same way: a name, a URL to poll and items that belong to it.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `name` | text, not null | Display name |
| `type` | text, not null | `rss` or `podcast_index` |
| `feed_url` | text, not null | RSS/Atom URL the worker polls |
| `site_url` | text | Publisher's site |
| `logo_url` | text | |
| `description` | text | |
| `is_active` | boolean, not null | Lets a broken source be disabled without deleting its items |
| `created_at` | timestamptz, not null | |

Unique constraint on `feed_url`, so the same feed cannot be added twice.

## `content_items`

One row per article, judgment or podcast episode.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, primary key | |
| `source_id` | uuid, not null, references `sources(id)` | |
| `type` | text, not null | `article`, `court_ruling` or `podcast_episode` |
| `external_id` | text, not null | Stable id from the feed |
| `title` | text, not null | |
| `url` | text, not null | Link to the publisher |
| `excerpt` | text | Summary only; never the full article body |
| `image_url` | text | |
| `author` | text | |
| `published_at` | timestamptz, not null | Stored in UTC |
| `created_at` | timestamptz, not null | |

**De-duplication.** Unique constraint on `(source_id, external_id)`. When a feed
omits an id, the adapter derives one from a hash of the normalised URL.
Deduplication is scoped to a single source: the same wire story on three outlets
is three legitimate rows.

**Indexes.**

- `(published_at desc)` for the feed.
- `(source_id, published_at desc)` for source pages.
- A full-text or trigram index on `title` and `excerpt` for search.

## Job queue

pg-boss creates and owns its own schema (`pgboss` by default). It must not be
modified by application migrations. The worker connects on the direct Postgres
port; see [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Accounts

Authentication is a later phase. When it arrives, user-owned tables (`saved
items`, `follows`) carry a nullable `user_id` referencing the identity
provider's user table. Until then, bookmarks are stored on the device and no
account tables exist.
