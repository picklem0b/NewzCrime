# Architecture

```
Expo app ──▶ Express API ──▶ Redis (cache)
                  │
                  ▼
             Postgres ◀── worker (RSS ingestion, pg-boss queue)
```

A modular monolith API plus a separate ingestion worker. The API is stateless
and read-heavy; the worker owns all scheduled fetching, retries and
de-duplication.

Two processes because ingestion is a background workload, not request/response.
Running feed fetches on a timer inside the API process means a slow upstream
feed competes with user requests.

## Services

| Layer | Local development | Production |
|---|---|---|
| Database | local Postgres | Supabase Postgres |
| Cache | local Redis | Upstash Redis (TCP endpoint) |
| Job queue | pg-boss, inside Postgres | same |
| API | `services/api` | same |
| Worker | `services/worker` | same |
| Language | TypeScript, strict, run through `tsx` | same |

## Packages

| Package | Responsibility |
|---|---|
| `@newzcrime/shared` | Domain types, constants, API client. Dependency-free so it stays cheap for the app to bundle |
| `@newzcrime/db` | Pool, repositories, cursor codec, migrations. Both services run the same SQL |
| `@newzcrime/cache` | Redis client with an in-process fallback |

## Database connections

pg-boss is a queue built inside Postgres and depends on session-level features,
including `LISTEN/NOTIFY`. Supabase exposes two relevant connection modes:

| Mode | Port | Usable by pg-boss |
|---|---|---|
| Direct connection | 5432 | Yes |
| Transaction pooler | 6543 | No — no `LISTEN/NOTIFY`, no session state |

Therefore:

- `DATABASE_URL` — pooled, port 6543, used by the **API** for high-concurrency
  reads.
- `DATABASE_URL_DIRECT` — direct, port 5432, used by the **worker**,
  **migrations** and **pg-boss**.

Pointing the worker at the pooled URL produces a queue that accepts jobs and
never processes them. The worker config reads `DATABASE_URL_DIRECT` for this
reason.

## Ingestion

Adapters live in `services/worker/src/adapters` and share one contract: given a
`sources` row, return normalised items. Adapters do not touch the database; the
job layer owns persistence, de-duplication and cache invalidation.

| Adapter | Provides | Notes |
|---|---|---|
| `rssAdapter` | News articles and podcast episodes | Handles RSS 2.0 and Atom; no key, no quota |
| `podcastIndexAdapter` | Podcast show discovery | Episodes still arrive through RSS |

The scheduler enqueues one fan-out job on a cron. That job reads the active
sources and enqueues one ingest job per source, so each feed fails or succeeds on
its own. A failing source is logged and counted; it does not fail the run.

A source's `contentType` decides the content kind of its items, and a keyword
classifier assigns each item a topic at ingest. Both are stored on the row, so
the feed filter is an indexed column lookup rather than a scan at request time.

## Caching

Redis caches feed pages, individual items, source lists and search results. Keys
are namespaced by the prefixes in `packages/shared/src/constants.ts`, and the
worker drops the feed and search namespaces when an ingest inserts something new.

If Redis is unreachable the cache degrades to an in-process map instead of
failing. `/health` reports which backend is live.

The job queue does not live in Redis; see the connection constraint above.

## Client audio

Podcast playback uses `react-native-track-player`. `expo-audio` can play in the
background but does not expose lock-screen control callbacks, and lock-screen
controls are a requirement for the podcast feature.

Track Player is a native module, so the app runs in a development build rather
than Expo Go. Platform configuration already in `app.json`:

- iOS: `UIBackgroundModes: ["audio"]`
- Android: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`,
  `WAKE_LOCK`

Episodes store the publisher's audio enclosure URL. Audio is streamed from the
publisher and never copied.

## Supabase

Production Postgres is Supabase, so the schema and queries are unchanged from
local development. Supabase also offers Auth, Storage and Realtime, none of
which are in use yet. Auth is the intended provider for the accounts phase.
