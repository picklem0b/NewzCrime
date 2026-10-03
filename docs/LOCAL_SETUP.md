# Local setup

## Requirements

- Node.js 20 or newer
- pnpm 9 (`packageManager` is pinned in the root `package.json`)
- Docker, for local Postgres and Redis

## Install

```bash
pnpm install
cp .env.example .env
```

The defaults in `.env.example` point at the addresses used by
`docker-compose.yml`, so no edits are needed for local development.

## Start Postgres and Redis

```bash
docker compose up -d
```

This starts:

| Service | Address |
|---|---|
| Postgres | `localhost:5432` |
| Redis | `localhost:6379` |

Both define health checks. Confirm they are ready with `docker compose ps`.

## Run

```bash
pnpm dev:api       # Express API
pnpm dev:worker    # ingestion worker
pnpm dev:mobile    # Expo app
```

The API and worker currently log a startup line and exit; neither opens a
database connection yet.

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

## Environment variables

`.env.example` documents every variable. The two that are easy to get wrong:

- `DATABASE_URL` — pooled connection, port 6543 on Supabase. Used by the API.
- `DATABASE_URL_DIRECT` — direct connection, port 5432. Used by the worker,
  migrations and pg-boss. pg-boss requires `LISTEN/NOTIFY`, which the
  transaction pooler does not support.

Locally both point at the same Docker Postgres instance.
