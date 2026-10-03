# NewzCrime

A mobile news reader for South African crime and court reporting, with podcasts.

The product aggregates reporting from South African outlets into one feed, with a
focus on court cases and crime. Podcasts are the second content type: shows are
discovered through Podcast Index and episodes are ingested from each show's own
RSS feed.

## Status

Scaffold only. The repository contains the workspace layout, dependency
manifests, TypeScript configuration and the domain types. No ingestion, API,
database or UI logic is implemented yet — route and screen files are
placeholders that return `null` or `501`.

## Repository layout

| Path | Purpose |
|---|---|
| `apps/mobile` | Expo (React Native) app, expo-router, TypeScript |
| `services/api` | Express REST API |
| `services/worker` | Ingestion worker and source adapters |
| `packages/shared` | Domain types, constants and the API client |
| `packages/db` | Database pool, migrations and query helpers |

## Running it

See [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md). Short version:

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm typecheck
```

The API and worker start with `pnpm dev:api` and `pnpm dev:worker`. Both log a
startup line and exit, because nothing consumes the connection yet.

### Development build required

Podcast playback uses `react-native-track-player`, a native module, so Expo Go
cannot run the app. Build a development client instead:

```bash
pnpm --filter ./apps/mobile android
pnpm --filter ./apps/mobile ios
```

## Documentation

| Document | Contents |
|---|---|
| [`docs/PRODUCT.md`](docs/PRODUCT.md) | What the product does and the scope of the first release |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System shape, services and data flow |
| [`docs/API.md`](docs/API.md) | HTTP endpoint contracts |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Database entities and keys |
| [`docs/SOURCES.md`](docs/SOURCES.md) | News and podcast sources, and the rules for using them |
| [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) | Local development setup |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Technical decisions and their rationale |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Deferred work and future phases |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | File naming, code organisation, commits and versioning |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Visual system and the artwork brief |
