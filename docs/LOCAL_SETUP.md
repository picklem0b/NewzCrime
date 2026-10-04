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

pnpm must use a hoisted `node_modules` layout, which the committed `.npmrc`
sets via `node-linker=hoisted`. This is not optional: Metro resolves deep
dependencies through the physical directory tree, and under pnpm's default
isolated layout `@expo/metro-config` cannot find `expo-asset`, so the bundler
fails before it starts. See
[`DECISIONS.md`](DECISIONS.md) for the full reasoning.

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

The app uses `react-native-track-player` to play podcast episodes. It is a
native module, and Expo Go only ships a fixed set of native modules, so
**Expo Go cannot play audio in this app and is not a supported target.**

There are two supported ways to run the app.

### Development build (recommended)

A development build is the app's own binary with the native modules compiled
in. It is built in Expo's cloud, so no Android SDK is needed locally, and it is
free — the free plan includes 15 Android and 15 iOS builds per month.

```bash
expo login                                  # once, free account
expo start --dev-client                     # start Metro
npx eas-cli build --profile development --platform android
```

The build prints a URL. Open it on the device, or install the `.apk` directly
(`eas.json` sets `buildType: "apk"` for exactly this reason — an `.aab` cannot
be side-loaded). Once installed, the app is a dev client: it loads JavaScript
from Metro over the network, so reloads are instant and unchanged since the
last bundle are cached.

Two things matter on a physical device:

- **Metro must be reachable.** The dev client connects to the URL printed by
  `expo start --dev-client`. If your phone and computer are on the same Wi-Fi,
  the LAN address works. Otherwise run `expo start --dev-client --tunnel`, which
  routes through Expo's servers.
- **`EXPO_PUBLIC_API_URL` must point at a reachable API.** It is inlined into the
  bundle at build time and defaults to `http://127.0.0.1:4000`. That default is
  correct when the API runs on the same device as the app (for example, the API
  in Termux beside your phone's client). If the API runs on a different machine,
  create `apps/mobile/.env` from `apps/mobile/.env.example` and set the LAN
  address.

### Expo Go (limited)

Expo Go can render the app's screens only if its SDK version matches the
project's. The project is on SDK 52, so it needs
[Expo Go for SDK 52](https://expo.dev/go?sdkVersion=52&platform=android&device=true);
the current Expo Go on the store targets SDK 57 and will refuse to open the
app with "Project is incompatible with this version of Expo Go".

Even on a matching Expo Go, playback is unavailable. Every player action is
already guarded — `useProgress` swallows the missing-module error and the store
catches failed setup — so the app runs and reports a playback error rather than
crashing.

### Other commands

```bash
pnpm --filter ./apps/mobile dev                 # expo start --dev-client
pnpm --filter ./apps/mobile build:dev:android   # EAS development APK
pnpm --filter ./apps/mobile build:preview:android
```

`pnpm --filter ./apps/mobile android` and `ios` run `expo run:*`, which compiles
locally and therefore does need the Android SDK or Xcode installed.
