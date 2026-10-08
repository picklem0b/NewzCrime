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

## Tests

```bash
pnpm test                  # every workspace
```

Individual workspaces also expose `test`:

```bash
pnpm --filter @newzcrime/worker test
pnpm --filter ./apps/mobile test
```

The tests are unit and contract tests; they need no database and no network.
The worker's RSS tests run against recorded feeds, and the SAFLII adapter's run
against a captured response, because SAFLII answers datacentre addresses with a
Cloudflare challenge. What is covered, and what is deliberately not, is
recorded in `docs/DECISIONS.md`.

`pnpm lint` runs ESLint for the mobile workspace. It is slow on a phone — the
first run can take a couple of minutes — but it should finish clean.

## Mobile app

The app uses `react-native-track-player` to play podcast episodes. It is a
native module, and Expo Go only ships a fixed set of native modules, so
**Expo Go cannot play audio in this app and is not a supported target.**

There is one supported way to run the app on a device.

### Building the app (the supported way)

The app is installed as its own binary, with the native modules compiled in and
the JavaScript bundled into it. It opens and renders on its own: there is no
development client, and nothing to connect to. EAS builds it in Expo's cloud, so
no Android SDK is needed locally, and it is free — the free plan includes 15
Android and 15 iOS builds per month.

```bash
pnpm exec expo login                        # once, free account
pnpm --filter ./apps/mobile build:apk:android
```

Neither `expo` nor `eas` is a global command. Both live in the project's
`node_modules`, so they are reached through `pnpm exec` or `npx` — as the
scripts above do — rather than by typing `expo` or `eas` on their own.

The build prints a URL. Open it on the device, or install the `.apk` directly
(`eas.json` sets `buildType: "apk"` for exactly this reason — an `.aab` cannot
be side-loaded). Because the JavaScript is compiled in, the app needs nothing
else running: no Metro, no computer.

One thing matters on a physical device:

- **`EXPO_PUBLIC_API_URL` must point at a reachable API.** It is inlined into the
  bundle at build time and defaults to `http://127.0.0.1:4000`. That default is
  correct when the API runs on the same device as the app (for example, the API
  in Termux beside the app). If the API runs on a different machine, create
  `apps/mobile/.env` from `apps/mobile/.env.example` and set the LAN address
  before building, because the value is compiled into the binary.

### Changing code: Expo Go

A standalone build carries a fixed copy of the JavaScript, so every edit means
another build. To iterate on screens, run Metro and open the app in Expo Go:

```bash
pnpm --filter ./apps/mobile dev
```

Expo Go renders the screens only if its SDK version matches the project's. The project is on SDK 52, so it needs
[Expo Go for SDK 52](https://expo.dev/go?sdkVersion=52&platform=android&device=true);
the current Expo Go on the store targets SDK 57 and will refuse to open the
app with "Project is incompatible with this version of Expo Go".

Even on a matching Expo Go, playback is unavailable, but the screens do render.
`react-native-track-player` builds its `Capability` enum out of the native
module while its own module body is being evaluated, so a plain `import` of it
throws wherever no native player exists and takes down every route that reaches
the player store or the player bar. The app therefore reaches it only through
the guarded loader in `src/services/playerService.ts`, which resolves the
module on first use and returns `null` when it is missing. Attempting to play
reports that audio is unavailable in this build instead of crashing.

### Where the APKs are

Built APKs are listed under the project's builds on
[expo.dev](https://expo.dev/accounts/the_devi/projects/newzcrime/builds), and
`eas build:view <id>` prints the download URL for any one of them.

### Android build settings that matter

Four settings in `app.json` exist for reasons that are not obvious, and each
produces a confusing failure or a needlessly large download if removed:

- `newArchEnabled: false`. `react-native-track-player` 4.1.2 has no New
Architecture support: its `TrackPlayerModule.add()` returns a Kotlin coroutine,
which the New Architecture's TurboModule interop refuses to parse, so the
module never loads and everything built on it is dead. Turning the New
Architecture back on breaks playback until the player reaches a stable release
that supports it.
- `expo-build-properties` → `android.kotlinVersion: "1.9.24"`. Expo's Android
template defaults `ext.kotlinVersion` to `1.9.25` but declares
`classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')` with no version, so
the plugin resolves to the 1.9.24 that `react-native` 0.76.5 pins. The two
disagree, and `expo-modules-core` picks its Compose compiler from
`ext.kotlinVersion`: 1.9.25 selects Compose 1.5.15, which refuses to run against
Kotlin 1.9.24 and fails `:expo-modules-core:compileReleaseKotlin`. Declaring the
version makes both sides agree, which selects the matching Compose 1.5.14.
- `expo-build-properties` → `android.usesCleartextTraffic: true`. Android 9 and
later block cleartext HTTP, and loopback is not exempt, so without this a
**release** build cannot reach an API on `http://`. A debug build is unaffected
because its manifest already allows it. Remove it once the API is served over
HTTPS.
- `./plugins/withAndroidBuildArchs` → `archs: ["arm64-v8a"]`. React Native
ships native libraries for four ABIs, and they were 80.6% of the first APK. The
other three are for emulators and 32-bit devices, so dropping them takes the
APK from 95 MB to about 38 MB. To build for an emulator as well, add
`"x86_64"` to the list. The plugin writes the filter in two places —
`gradle.properties` and an appended block in `app/build.gradle` — because the
React Native Gradle plugin only honours the first of those under the New
Architecture, which this app does not use. Dropping either write silently loses
the trim.

### Other commands

```bash
pnpm --filter ./apps/mobile dev                 # expo start (Expo Go)
pnpm --filter ./apps/mobile test
pnpm --filter ./apps/mobile lint
pnpm --filter ./apps/mobile build:apk:android   # EAS standalone APK
pnpm --filter ./apps/mobile build:store:android # EAS app bundle for Google Play
```

`pnpm --filter ./apps/mobile android` and `ios` run `expo run:*`, which compiles
locally and therefore does need the Android SDK or Xcode installed. EAS builds
in Expo's cloud instead, and its free plan includes 15 Android and 15 iOS builds
per month.
