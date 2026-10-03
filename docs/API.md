# API

REST over HTTP. All routes are versioned under `/v1`. Responses are JSON.

None of these routes are implemented yet; the routers currently answer `501
Not Implemented`.

## Conventions

- **Pagination is cursor-based.** List responses are `Paginated<T>`:
  `{ items: [...], nextCursor: string | null }`. Clients pass the previous
  response's `nextCursor` as `?cursor=`. Cursors are opaque.
- **Errors** use `ApiErrorBody`, returned by every failing endpoint:

  ```json
  { "error": "not_found", "message": "No item with that id", "details": {} }
  ```

  `error` is a stable machine-readable code; `message` is optional and for
  humans; `details` carries validation errors.

- **Caching.** Read endpoints set `Cache-Control` and are served through Redis.
  Cache TTLs are defined in `packages/shared/src/constants.ts` (`CACHE_TTL`).

## Endpoints

### `GET /v1/feed`

Reverse-chronological feed of articles, judgments and optionally podcast
episodes.

| Parameter | Type | Notes |
|---|---|---|
| `topic` | `Topic` | `all`, `court`, `crime`, `politics`, `world`. Defaults to `all` |
| `sourceId` | string | Restrict to one source |
| `includePodcasts` | `1` | Include podcast episodes; omitted by default |
| `cursor` | string | Opaque pagination cursor |
| `limit` | number | Page size. Default `PAGE_SIZE_DEFAULT`, max `PAGE_SIZE_MAX` |

Returns `Paginated<ContentItem>`.

### `GET /v1/items/:itemId`

Returns one `ContentItem`, or `404` with `ApiErrorBody` when the id is unknown.

### `GET /v1/sources`

Returns the list of news outlets and podcast shows.

### `GET /v1/sources/:sourceId`

Returns one `Source`, or `404` when the id is unknown.

### `GET /v1/sources/:sourceId/items`

Returns `Paginated<ContentItem>` for one source. Accepts `cursor` and `limit`.

### `GET /v1/search`

Full-text search over stored articles and episodes.

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Search term. Required |
| `cursor` | string | Opaque pagination cursor |
| `limit` | number | Page size |

Returns `Paginated<ContentItem>`. Search runs against the local database only;
the API does not proxy third-party search APIs. See
[`DECISIONS.md`](DECISIONS.md).

### `GET /health`

Readiness probe. Reports process status and database connectivity.

## Types

Request and response shapes come from `packages/shared`: `ContentItem`,
`Source`, `Paginated<T>`, `FeedQuery` and `ApiErrorBody`.
