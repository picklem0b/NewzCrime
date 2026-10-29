# NewzCrime

A mobile news reader for South African crime and court reporting, with podcasts.

NewzCrime aggregates reporting from South African outlets into one feed,
organised around court, crime, politics and world news, and links every item
through to the publisher. Podcasts are the second content type: curated crime
and true-life shows, with background audio and lock-screen controls.

## What works

| Area      | State                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Ingestion | 29 active sources: 10 outlets, 13 court divisions and 6 shows, run 2-hourly |
| Database  | `sources` and `content_items`, with full-text and trigram search indexes |
| API       | Feed, item, source, podcast, search and health endpoints under `/v1`     |
| Cache     | Redis with an in-process fallback; feed and search invalidated on ingest |
| Mobile    | Today, Discover, Podcasts and Library, with search and settings on top   |
| First run | A one-time illustrated introduction that preloads the feed before Today   |

Two publishers (Daily Maverick, News24) are seeded but switched off: their feeds
refuse this host. Turn them on where they are reachable.

## Not built yet

Accounts and syncing. Bookmarks and settings live on the device. Everything
else deferred — YouTube video, live streams, audiobooks and newsletters — is
recorded in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Repository layout

| Path              | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `apps/mobile`     | Expo (React Native) app, expo-router, TypeScript |
| `services/api`    | Express REST API                                 |
| `services/worker` | Ingestion worker, adapters and pg-boss queue     |
| `packages/shared` | Domain types, constants and the API client       |
| `packages/db`     | Database pool, repositories and migrations       |
| `packages/cache`  | Redis client with a memory fallback              |

## Running it

See [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md). Short version:

```bash
pnpm install
cp .env.example .env
pnpm db:setup     # migrate, seed sources, report host and row counts
pnpm ingest       # one ingest run
pnpm db:verify    # confirm sources and items are present
pnpm dev:api      # API on :4000
pnpm dev:worker   # scheduler and queue
pnpm dev:mobile   # Expo
```

Postgres and Redis must be reachable at the addresses in `.env`. For Supabase,
the two URLs are the transaction pooler (6543, used by the API) and the session
pooler (5432, used by migrations and ingestion); [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
has the step-by-step.

If the app shows "No stories here yet", run `pnpm db:verify`. It distinguishes
an empty database from one the API cannot reach, and tells you which ingest
command to run.

### Installing it on a phone

Podcast playback uses `react-native-track-player`, a native module, so the app
needs its own binary rather than Expo Go. EAS compiles it in Expo's cloud, on
the free plan, so no Android SDK is needed locally. The binary compiles the
JavaScript into itself, so it opens on its own — there is no development client
and nothing to connect to:

```bash
pnpm exec expo login
pnpm --filter ./apps/mobile build:apk:android       # standalone APK, no Metro
```

`pnpm exec` matters: `expo` and `eas` are project dependencies, not global
commands. `pnpm --filter ./apps/mobile android` compiles locally instead, and
does need the Android SDK or Xcode.

EAS build credits are limited, so routine releases do not use EAS at all. The
`Android APK` GitHub Actions workflow runs `expo prebuild` and Gradle on a free
runner, signs with the release keystore, and attaches the APK to a GitHub
Release. Pushing a `v*` tag triggers it, and the app's update check downloads
that asset. Secrets and the Supabase-first setup are in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Documentation

| Document                                       | Contents                                           |
| ---------------------------------------------- | -------------------------------------------------- |
| [`docs/PRODUCT.md`](docs/PRODUCT.md)           | What the product does and the scope of the release |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System shape, services and data flow               |
| [`docs/API.md`](docs/API.md)                   | HTTP endpoint contracts                            |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)     | Database tables and indexes                        |
| [`docs/SOURCES.md`](docs/SOURCES.md)           | The outlets and shows that are ingested            |
| [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md)   | Local development setup                            |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)     | Free Supabase + Render + Actions deployment        |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)       | Technical decisions and their rationale            |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)           | Phase history and deferred work                    |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)   | File naming, code organisation, commits and tags   |
| [`docs/DESIGN.md`](docs/DESIGN.md)             | Visual system and the artwork brief                |
| [`docs/audit/`](docs/audit/)                   | Production-readiness audit and its findings        |

## Creator

Lethabo KHEDAMA
