# 01 — Repository Overview

> Produced by the production-readiness audit. Facts here were read from the
> tree at commit `6df34ba` (tag `v1.12.8`) plus the audit fixes on the working
> tree. Nothing is asserted that was not observed.

## Shape

`NewzCrime` is a pnpm workspace monorepo:

```
apps/mobile        Expo (React Native, TypeScript) client
services/api       Express 4 API (TypeScript)
services/worker    pg-boss ingest worker (TypeScript)
packages/shared    types, runtime constants, fetch-based API client
packages/db        pg pool, migrations, repositories, cursor codec
packages/cache     Redis cache with an in-process fallback
docs/              product, design, architecture and audit record
```

Workspace commands run through `pnpm -r` from the root
(`typecheck`, `test`, `lint`).

## Subsystems

| Subsystem | Entry point | Responsibility |
|---|---|---|
| Mobile app | `apps/mobile/src/app/_layout.tsx` | Expo Router stack + tab bar, hydration, error boundary, player registration |
| API | `services/api/src/index.ts` | config → db + cache → `createApp` → listen → graceful shutdown |
| Worker | `services/worker/src/index.ts` | cron fan-out, per-source ingest jobs, adapters |
| DB | `packages/db/src/index.ts` | pool, `query`, `withClient`, `healthCheck`, `close` |
| Cache | `packages/cache/src/index.ts` | `get`/`set`/`del`/`delByPrefix`, Redis→memory fallback |
| Shared | `packages/shared/src/index.ts` | contracts, constants, `createApiClient` |

## Data flow

```
RSS / SAFLII / PodcastIndex
        │
        ▼
  worker adapters ──► contentItemRepository.upsertItems ──► Postgres
        │                                              │
        │ delByPrefix (cache invalidation)             │
        ▼                                              ▼
      Redis ◄──── feedService / itemService / searchService ────► API
        │
        ▼
   createApiClient (mobile) ──► hooks ──► screens
```

- Ingestion is **idempotent** per source: unique `(source_id, external_id)`,
  `ON CONFLICT DO UPDATE`, chunked inserts of 100 rows.
- Reads are **keyset-paginated** (cursor = `published_at|id`, base64url), not
  `OFFSET`, because items are inserted continuously.
- Cached reads share the `feed:` prefix so a source ingest invalidates both
  feed pages and that source's item list.

## Boundaries

- `packages/shared` is the only code imported by both client and server; it is
  deliberately dependency-free (hand-rolled query encoding, because React
  Native's `URL` is incomplete).
- The mobile client never talks to Postgres/Redis; the worker never talks to
  the client.
- `createApp(deps)` takes config, db, cache and logger as arguments, so the app
  can be built in tests without binding a port.

## API surface

| Method | Path | Router |
|---|---|---|
| GET | `/health` | `healthRouter` |
| GET | `/v1/app/version` | `appRouter` |
| GET | `/v1/feed` | `feedRouter` |
| GET | `/v1/items/:id` | `itemRouter` |
| GET | `/v1/sources` | `sourceRouter` |
| GET | `/v1/sources/:id` | `sourceRouter` |
| GET | `/v1/sources/:id/items` | `sourceRouter` |
| GET | `/v1/podcasts` | `podcastRouter` |
| GET | `/v1/search` | `searchRouter` |

Middleware order (all before routes, error handlers last): helmet → cors →
compression → pino-http → `express.json({ limit: '100kb' })` → rate limit.

## Architectural risks identified

| # | Risk | Severity |
|---|---|---|
| R1 | App icon and splash assets are absent (`assets/` holds only `.gitkeep`; `app.json` declares no `icon`/`splash`) — builds ship Expo defaults | High (product) |
| R2 | `DEFAULT_BASE_URL` is `http://127.0.0.1:4000`; on a physical device that is the *device*, so a build without `EXPO_PUBLIC_API_URL` cannot reach the API | High (ops) |
| R3 | `usesCleartextTraffic: true` is set for all Android builds, including production | Medium |
| R4 | Two routes render the same Settings screen (`app/settings/Settings`, `app/tabs/Settings`); only the former is linked | Low |
| R5 | `useFeed.loadMore` swallows pagination errors silently | Low |
| R6 | `checkForUpdates` bypassed the version-format guard (fixed in this pass) | Medium |

## Areas needing deeper investigation (mapped to later docs)

- Type safety / `any` usage → `02-code-quality.md`
- Mobile lifecycle, lists, player → `03-mobile-audit.md`
- Endpoint semantics, validation, timeouts → `04-backend-audit.md`
- Index coverage and query plans → `05-database-audit.md`
- Secrets, CORS, rate limiting, cleartext → `06-security-audit.md`
- Bundle/module counts, query count → `07-performance-audit.md`
- Coverage by workspace → `08-testing-audit.md`
