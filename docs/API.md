# API

REST over HTTP. Every route is versioned under `/v1`, except the health probe.
Responses are JSON.

## Conventions

- **Pagination is cursor-based.** List responses are `Paginated<T>`:
  `{ items: [...], nextCursor: string | null }`. Clients pass the previous
  response's `nextCursor` as `?cursor=`. Cursors are opaque and encode the sort
  key of the last row, which keeps pages stable while new items arrive.
- **Errors** use `ApiErrorBody`, returned by every failing endpoint:

  ```json
  { "error": "not_found", "message": "No item with that id", "details": {} }
  ```

  `error` is a stable machine-readable code; `message` is optional and for
  humans; `details` carries validation errors, one entry per field.
- **Validation** runs before any query. An invalid parameter returns `400` with
  `error: "invalid_request"` and the offending field paths.
- **Rate limiting** applies to the whole surface at `API_RATE_LIMIT_MAX`
  requests per `API_RATE_LIMIT_WINDOW_MS` per IP. Limits are reported in the
  `RateLimit` headers.
- **Caching.** Read endpoints set `Cache-Control` and are served through Redis.
  TTLs are in `packages/shared/src/constants.ts`.

## Endpoints

### `GET /v1/feed`

Reverse-chronological feed of articles, judgments and optionally podcast
episodes.

| Parameter | Type | Notes |
|---|---|---|
| `topic` | `Topic` | `all`, `court`, `crime`, `politics`, `world`. Defaults to `all` |
| `sourceId` | uuid | Restrict to one source |
| `includePodcasts` | `1` or `true` | Include podcast episodes; omitted by default |
| `cursor` | string | Opaque pagination cursor |
| `limit` | number | Page size. Default 20, max 100 |

Returns `Paginated<ContentItem>`.

### `GET /v1/items/:itemId`

Returns one `ContentItem`, or `404` with `ApiErrorBody` when the id is unknown.

### `GET /v1/sources`

Returns every outlet and podcast show.

### `GET /v1/sources/:sourceId`

Returns one `Source`, or `404` when the id is unknown.

### `GET /v1/sources/:sourceId/items`

Returns `Paginated<ContentItem>` for one source. Accepts `cursor` and `limit`.

### `GET /v1/podcasts`

Returns the curated podcast shows — the `sources` rows whose `contentType` is
`podcast_episode`.

### `GET /v1/search`

Full-text search over stored items.

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Search term, 2–120 characters. Required |
| `cursor` | string | Opaque pagination cursor |
| `limit` | number | Page size |

Returns `Paginated<ContentItem>`. Queries run against a stored `tsvector` with a
trigram-indexed `ILIKE` fallback for prefixes. Search runs against the local
database only; the API does not proxy third-party search APIs.

### `GET /v1/app/version`

Release metadata for the app's update check: `latestVersion`, `minimumVersion`
and the release notes. Values come from `@newzcrime/shared`, so the client and
the server cannot disagree about them.

### `GET /health`

Readiness probe. Reports database reachability, which cache backend is live, and
process uptime. Returns `503` when the database is unreachable.

## Types

Request and response shapes come from `packages/shared`: `ContentItem`,
`Source`, `Paginated<T>`, `FeedQuery`, `ItemTopic` and `ApiErrorBody`.
