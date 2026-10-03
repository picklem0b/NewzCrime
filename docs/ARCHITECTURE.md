# Architecture

```
Expo app ──▶ Express API ──▶ Redis (cache)
                  │
                  ▼
             Postgres ◀── worker (RSS, Podcast Index)
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
| Database | Postgres via `docker-compose` | Supabase Postgres |
| Cache | Redis via `docker-compose` | Upstash Redis |
| Job queue | pg-boss (inside Postgres) | pg-boss (inside Postgres) |
| API | `services/api` | same |
| Worker | `services/worker` | same |
| Language | TypeScript, strict, run through `tsx` | same |

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
| `rssAdapter` | News articles and podcast episodes | No key, no quota |
| `podcastIndexAdapter` | Podcast show discovery | Episodes still arrive through RSS |

## Caching

Redis caches feed responses, upstream payloads and rate-limit counters. The job
queue does not live in Redis; see the connection constraint above. The cache
client is not wired up yet.

## Client audio

Podcast playback uses `react-native-track-player`. `expo-audio` can play in the
background but does not expose lock-screen control callbacks, and lock-screen
controls are a requirement for the podcast feature.

Track Player is a native module, so the app runs in a development build rather
than Expo Go. Platform configuration already in `app.json`:

- iOS: `UIBackgroundModes: ["audio"]`
- Android: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`,
  `WAKE_LOCK`

## Supabase

Production Postgres is Supabase, so the schema and queries are unchanged from
local development. Supabase also offers Auth, Storage and Realtime, none of
which are in use yet. Auth is a candidate for the accounts work in a later
phase.
