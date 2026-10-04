# Local setup

## Requirements

- Node.js 20 or newer
- pnpm 9 (`packageManager` is pinned in the root `package.json`)
- Postgres and Redis, reachable at the addresses in `.env`

`docker-compose.yml` provides both if you would rather not run them natively:

```bash
docker compose up -d
```

## Install

```bash
pnpm install
cp .env.example .env
```

The defaults in `.env.example` point at the addresses used by
`docker-compose.yml`. Two are easy to get wrong:

- Use `127.0.0.1`, not `localhost`. Some local Postgres servers listen on IPv4
  only, and Node resolves `localhost` to `::1` first.
- `DATABASE_URL` is the pooled connection (port 6543 on Supabase), used by the
  API. `DATABASE_URL_DIRECT` is the direct connection (port 5432), used by the
  worker, migrations and pg-boss. Pointing the worker at the pooled URL produces
  a queue that accepts jobs and never runs them.

## Create the database

The application needs its own role and database:

```bash
createuser --createdb newzcrime
createdb --owner newzcrime newzcrime
```

Then apply the schema and seed the starter sources:

```bash
pnpm --filter @newzcrime/db migrate up
```

This creates `sources`, `content_items`, the search indexes and the pg-boss
schema, then inserts the outlets and podcast shows listed in
[`SOURCES.md`](SOURCES.md).

## Collect content

```bash
pnpm --filter @newzcrime/worker ingest
```

Reads every active source once and exits. Pass a source id to ingest just one.
A source that fails is reported and skipped; the run continues.

## Run

```bash
pnpm dev:api       # Express API on :4000
pnpm dev:worker    # scheduler, queue and ingest handlers
pnpm dev:mobile    # Expo
```

The worker enqueues one ingest run at startup by default. Set
`WORKER_INGEST_ON_START=false` to leave that to the cron schedule.

## Check it

```bash
curl http://127.0.0.1:4000/health
curl 'http://127.0.0.1:4000/v1/feed?limit=3'
curl 'http://127.0.0.1:4000/v1/search?q=court'
```

`/health` reports whether the database is reachable and which cache backend is
live. `"cache": "memory"` means Redis was unreachable and the API fell back to
an in-process cache — the app still works, and responses are no longer shared.

## Type checking

```bash
pnpm typecheck             # every workspace
```

Individual workspaces also expose `typecheck`, for example:

```bash
pnpm --filter @newzcrime/api typecheck
```

## Mobile app

The app uses `react-native-track-player`, a native module, so Expo Go will not
run it. Use a development build:

```bash
pnpm --filter ./apps/mobile android
pnpm --filter ./apps/mobile ios
```

`expo start` alone is only useful for Expo's bundler in a development build.

`EXPO_PUBLIC_API_URL` is read at build time and defaults to
`http://127.0.0.1:4000`. A device on the same network needs the host machine's
LAN address instead.
