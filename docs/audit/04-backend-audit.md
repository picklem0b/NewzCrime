# 04 — Backend & API Audit

Scope: `services/api`, `services/worker`.

## App factory

Middleware order in `createApp` is correct and deliberate:

```
helmet → cors → compression → pino-http → express.json(100kb)
       → express-rate-limit → routes → notFound → errorMiddleware
```

- `x-powered-by` disabled.
- `trust proxy` is **configurable** (`TRUST_PROXY`) and defaults to `false`.
  This matters: Express reads `X-Forwarded-For` when a proxy is trusted, so
  trusting a proxy that is not present lets a caller mint a fresh rate-limit
  bucket with a header. Default-off is the safe default.
- CORS: an explicit `CORS_ORIGINS` list always wins; with none, production
  blocks cross-origin reads (`false`) and development reflects (`true`).
  This closes a deployment that forgets the variable instead of opening it.
  (The `ApiConfig.corsOrigins` doc comment previously claimed "empty means
  same-origin only", which did not match behaviour; corrected this pass.)
- Body limit `100kb` bounds request size.

## Validation

Every route parses its input with zod before touching a service:

| Route | Schema |
|---|---|
| `/v1/feed` | `feedQuerySchema` — enum topic, uuid sourceId, boolean flag, `limit` clamped `1..100` |
| `/v1/items/:itemId` | `itemParamsSchema` |
| `/v1/sources/:id` | `resourceParams.schema` |
| `/v1/search` | `searchQuerySchema` |

`limit` is coerced, bounded and defaulted, so a client cannot request an
unbounded page. A zod failure is turned into a **400** with a per-field
`details` array by the error middleware, not a 500.

## Error handling

`errorMiddleware` is terminal and guarantees one response shape
(`ApiErrorBody`) for every failure:

| Case | Status | Body |
|---|---|---|
| `HttpError` (e.g. 404 item) | as thrown | `{ error, message, details }` |
| `ZodError` | 400 | `{ error: 'invalid_request', details: [{path,message}] }` |
| unknown | 500 | `{ error: 'internal_error', message: 'Something went wrong' }` + logged with stack |

- `res.headersSent` is honoured (`next(error)`) rather than writing twice.
- Unknown errors are logged with method/path/stack and reported opaquely, so
  internals never leak to the client.

## Caching

- Reads are cached per service (`FEED` 300s, `ITEM` 3600s, `SOURCES` 3600s,
  `SEARCH` 120s) and responses carry matching `Cache-Control`.
- Key prefixes come from `CACHE_PREFIX` in `@newzcrime/shared`, shared with
  the worker so ingest invalidates exactly what it should.
- The memory fallback applies the **same prefix** (commented), otherwise
  `delByPrefix` would silently no-op and stale pages would outlive their TTL
  whenever Redis is down. Verified correct.

## Health

`GET /health` calls `db.healthCheck()` and returns `200 {status:'ok'}` or
`503 {status:'degraded'}` with `database`, `cache` backend and uptime.
`healthCheck` catches internally and returns a boolean, so a down database
yields 503 rather than an unhandled 500.

## Worker

- pg-boss queue with a cron fan-out (`ingestAllJob`) and per-source jobs
  (`ingestSourceJob`).
- Adapters (`rssAdapter`, `safliiAdapter`, `podcastIndexAdapter`) return
  `NormalizedItem[]` and never touch the database — they are unit-tested in
  isolation (20 + 14 tests).
- Ingestion is idempotent (`ON CONFLICT (source_id, external_id) DO UPDATE`)
  and tolerant of per-source failure.
- Structured pino logging with graceful shutdown.

## Issues found

| # | Issue | Severity | Action |
|---|---|---|---|
| B1 | `corsOrigins` doc comment contradicted behaviour | Low | **Fixed** — comment corrected |
| B2 | `TRUST_PROXY` was previously hardcoded; now validated (`true`/`false`/hops) | Medium | **Fixed** |
| B3 | Worker retry/backoff policy for failed sources not measured under a failing upstream in this pass | Medium | Recorded |

## Verdict

The API is small, validated end to end, and predictable: typed config,
zod-validated inputs, one error shape, bounded pagination, cache with a safe
fallback, and a health probe. No N+1 patterns were found — each endpoint
issues a single bounded query. No injection surface: all SQL uses
placeholders (see `05`).
