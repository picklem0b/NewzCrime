# 07 — Performance Audit

## Mobile

### Bundle
- Metro full-graph bundle: **4532 modules, 0 resolution errors** (measured).
- The bundle step fails only at `hermesc` with `SIGILL` on this host — the
  prebuilt `linux64` binary running on ARM under Termux, **not** project
  code. EAS builds on x64, which is why the APK builds fine.
- One ABI only (`arm64-v8a`) via `withAndroidBuildArchs`; verified in the
  produced APK (23 `lib/arm64-v8a/` entries, single ABI).

### Rendering
- Long lists use `@shopify/flash-list` with `estimatedItemSize`, which
  recycles rows rather than mounting the whole list.
- Images use `expo-image` (memory/disk caching, no full-res decode into the
  JS thread).
- The item detail gradient is scoped to the header, not the full article —
  a full-article `LinearGradient` is an expensive offscreen layer.
- Async hooks guard against setting state after unmount (generation counter
  in `useFeed`/`useSearch`, `isActive` in `useAsync`), avoiding wasted work
  and stale renders.

### Measured build facts
| Signal | Value |
|---|---|
| Full graph modules | 4532 |
| Mobile unit tests | 105 across 11 files, ~8.6s |
| Typecheck (mobile) | clean, no incremental cache used |

## Backend

### Query count per request
Each read endpoint issues **one** bounded query — verified by reading the
services, not inferred:

| Endpoint | Queries |
|---|---|
| `/v1/feed` | 1 (cache miss) |
| `/v1/items/:id` | 1 |
| `/v1/sources` | 1 |
| `/v1/sources/:id` | 1 |
| `/v1/sources/:id/items` | 1 |
| `/v1/podcasts` | 1 |
| `/v1/search` | 1 |
| `/health` | 1 (`select 1`) |

No N+1: there is no per-row follow-up query anywhere in the repositories.

### Caching
- Cache hit avoids the database entirely (`feedService` returns the cached
  page before calling `listItems`).
- TTLs are per-resource (`FEED` 300, `ITEM`/`SOURCES` 3600, `SEARCH` 120).
- Ingest invalidates by prefix, so the cache cannot serve a permanently
  stale feed.
- Redis failure degrades to an in-process map rather than erroring, so the
  API stays up (observed: "redis unavailable; using in-memory cache" with
  requests still served).

### Response cost
- `compression()` gzips JSON; responses carry `Cache-Control`.
- `LIMIT limit+1` pagination avoids a `COUNT(*)` per page.
- The worker chunks inserts at 100 rows to keep parameter counts bounded.

## Bottlenecks identified

| # | Bottleneck | Evidence | Severity |
|---|---|---|---|
| P1 | Cold-start JS graph is large (4532 modules) | Metro count | Medium — normal for an Expo app; impacts cold start |
| P2 | No measured query plan at volume | Postgres unavailable in audit env | Unknown |
| P3 | Worker throughput unmeasured under many sources | no load harness | Low at current source count (~16) |

## Not optimised (deliberately)

No change was made "because it looked slow". Every item above is either
measured or explicitly marked unmeasured. Optimisation without a profile
would risk correctness for no proven gain.

## Verdict

Backend performance is good by construction: one bounded, indexed query per
request, aggressive caching with a safe fallback, compression, and no N+1.
Mobile performance is normal for Expo SDK 52 with the levers that matter
already pulled (FlashList, expo-image, scoped gradients). The open question
is empirical — query plans and cold-start timing need a live environment.
