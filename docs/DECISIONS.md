# Decisions

Technical decisions that are settled, with the reasoning that led to them.
Entries are added when a decision is made, not when it is implemented.

## Platform: Expo / React Native

Chosen over Flutter and over a web app wrapped with Capacitor.

- **Flutter** uses Dart, a separate language and toolchain from the JavaScript
  already used across the rest of the project.
- **Capacitor** reuses web skills, but the demanding parts of this app are
  native: background audio, lock-screen controls and downloads. It also risks
  App Store rejection under guideline 4.2, which targets apps that are web
  content in a wrapper.
- **React Native with Expo** shares one language with the API and worker and has
  maintained native audio and notification libraries.

## Language: TypeScript

The whole workspace is TypeScript in strict mode. Types are erased at runtime;
the compiler catches mistakes before execution. `tsconfig.base.json` is the
source of truth and each workspace extends it.

Strict settings that earn their place: `noUncheckedIndexedAccess` (indexed
access returns `T | undefined`, which is what the runtime already does) and
`verbatimModuleSyntax` (type-only imports must say so, keeping emitted output
predictable).

## Ingestion: RSS before any API

The first release ingests RSS only. RSS requires no API key, no quota and no
publisher agreement, and it exercises the full pipeline: fetch, normalise,
de-duplicate, store, cache, serve, render. Adding a second vertical afterward
reuses that pipeline instead of extending it.

## Court judgments: an adapter of their own, not the generic RSS one

The first release recorded that SAFLII publishes no RSS feed. That was wrong:
it publishes one per court. The feeds are standard RSS, which is why they were
almost ingested by `rssAdapter` — but an item carries only a title and a link.
With no `pubDate`, every judgment would have been dated with the ingest time and
stacked on top of the live news feed.

The decision was therefore to give them a `saflii` source type and a normaliser
of their own that reads the date, neutral citation and case number out of the
title. The alternative — teaching `rssAdapter` to guess at dates from arbitrary
titles — would have paid for SAFLII's shape in every other publisher's parser.

`content_type` stays the classifier's concern: every SAFLII source is
`court_ruling`, and a judgment's title is a case name, which the keyword
heuristic reads as *nothing*. A court-ruling feed that files its rulings under no
topic is useless, so `court_ruling` items are tagged `court` on their face
rather than classified.

The court feeds are seeded active even though this development host is blocked
by Cloudflare. The blockage is a property of the host, not of the source, and
shipping the feature switched off would hide a working pipeline from production.
A blocked feed fails per source, like any other.

## Cache: Redis over TCP, never the REST client

The scaffold depended on `@upstash/redis`, a REST client. It cannot open a
`redis://` socket, so caching was dead on arrival against a local Redis. REST is
the right choice for serverless, and this system is not serverless: pg-boss
requires a long-running worker.

The cache package therefore uses `ioredis` over TCP everywhere — local
development against Redis, and Upstash's TCP endpoint (`rediss://`) in
production. The same client also satisfies what a Redis-backed rate limiter
would need.

The cache degrades to an in-process map when Redis is unreachable. Cache loss is
a latency problem, not an outage.

## Queue: pg-boss in Postgres

pg-boss stores its queue in Postgres, so no additional service is required.
Alternatives such as BullMQ need Redis blocking commands, which a REST interface
does not provide.

Because pg-boss depends on `LISTEN/NOTIFY`, the worker connects on port 5432,
never the Supabase transaction pooler on 6543. See
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Configuration: fail fast, not silently

An unset or misspelled variable previously became an empty string, so a service
booted and then failed somewhere unrelated. Both services now parse their
environment with zod at startup and exit with a message naming the variable.

## Logging: pino

Structured JSON, one line per event, in both services. The worker has no HTTP
requests to log, so a request-oriented logger would leave it with no logging at
all. `pino-http` covers the API's requests on the same pipeline.

## Source type and content type are separate columns

`sources.type` says how a source is fetched (`rss`, `podcast_index`,
`saflii`). `sources.content_type` says what its items are (`article`,
`court_ruling`, `podcast_episode`). One column could not express both: a podcast
show is fetched over RSS but produces episodes, and the feed needs to
distinguish them.

## Topic is classified at ingest and stored

The feed filter is one of the most common reads, and a keyword match over title
and excerpt at request time would be a scan. Classifying once at ingest makes
`topic` an indexed column. The classifier is a heuristic and stores `null` when
nothing matches; untagged items still appear under `all`.

## Podcast audio is stored as the enclosure URL

An episode without its audio source can be listed but not played. The adapter
reads the audio enclosure (RSS) or enclosure link (Atom) and stores it on the
item. Audio is streamed from the publisher and never copied.

## Background audio: react-native-track-player

`expo-audio` plays audio in the background but does not expose lock-screen
control callbacks. A podcast app that cannot be paused from the lock screen does
not meet the requirement, so the app uses `react-native-track-player`.

The cost is a native module: Expo Go no longer runs the app, so development
happens in a development build.

## Database: Postgres, Supabase in production

Supabase is Postgres, so local development runs the same engine and the schema
is unchanged in production. It also provides Auth, Storage and Realtime as
options for later phases.

## Search runs against the local database

`GET /v1/search` queries stored items. It does not proxy a third-party search
API. Third-party quotas are shared across every user of the app, and a keyword
search endpoint a user can trigger repeatedly would exhaust that quota.

## API: REST under `/v1`, cursor pagination

REST with JSON is sufficient for a read-heavy feed API. Cursor pagination is
used instead of offset because feed content is inserted continuously and offset
pages drift as items are added.

## Routes: static paths with query parameters

expo-router supports dynamic segments with bracket filenames such as
`[id].tsx`. This project uses static route names with query parameters instead,
so file names follow the naming convention in
[`CONVENTIONS.md`](CONVENTIONS.md). The trade-off is URLs of the form
`/detail/ItemDetail?itemId=42` rather than `/detail/42`.

## Update check: server-reported versions

The app compares its installed version against the release the API reports, and
offers the update when a newer one exists. The version constants live in
`@newzcrime/shared`, so the client and server cannot disagree. Installing still
happens through the store or the development build.

## Monorepo: pnpm with a hoisted `node_modules`

The workspace uses pnpm, but with `node-linker=hoisted` in `.npmrc` rather than
pnpm's default isolated layout.

Metro resolves a module by walking the physical `node_modules` directories above
the requiring file. Under isolation, the only copy of a transitive package lives
in `node_modules/.pnpm/`, reachable by symlink only from the packages that
declare it. `@expo/metro-config` requires `expo-asset`, which `expo` declares,
but the config itself cannot see it — so `expo start` failed before Metro began
bundling. The symptom is a project that appears to hang and then never loads.

Expo [documents](https://docs.expo.dev/guides/monorepos/) hoisting as the fix for
pnpm, and it resolves the whole class of problem at once rather than one missing
package at a time.

One module still needed an explicit entry. `expo-router` imports `query-string`
without declaring it as a dependency, so it is absent from the tree entirely;
it is now a direct dependency of the app, pinned to `^7.1.3`. Version 8 and later
of `query-string` are ESM-only, which Metro's CommonJS bundling does not load.

## Development builds, not Expo Go

`react-native-track-player` is a native module. Expo Go ships a fixed set of
native modules and cannot load it, so **Expo Go cannot play audio in this app**.
Development happens in a development build, which EAS compiles in the cloud on
the free plan.

***Caveat.*** Guarding the player's *calls* is not enough, and the first attempt
at this was wrong. Track Player builds its `Capability` enum by reading the
native module while its own module body is being evaluated, so a static
`import` of it throws `Cannot read property 'CAPABILITY_PLAY' of null` — before
any of the app's own code runs. Because the player store and the player bar are
reached from nearly every screen, that single import took down the whole route
table: expo-router reported every route as missing a default export, which
points at the routes rather than at the real cause.

Access therefore goes through `src/services/playerService.ts`, which resolves
the module on first use and returns `null` when it is absent. The progress poll
is local to `usePlayer` rather than borrowed from the library's `useProgress`,
for the same reason: importing that hook is what evaluates the module. A
matching Expo Go now renders every screen, and attempting to play reports that
playback needs a development build. This is a convenience for reviewing layout,
not a supported target.

## Android: Kotlin and the Compose compiler agree by declaration

Expo's Android template writes `kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.25'`
but declares `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')` with no
version. The plugin there resolves to whatever is already on the classpath, and
`react-native` 0.76.5 pins 1.9.24 in its own version catalog. The two then
disagree.

That is fatal because `expo-modules-core` derives its Compose compiler
extension from `ext.kotlinVersion`, using a table of known-good pairs: 1.9.24 →
Compose 1.5.14, 1.9.25 → Compose 1.5.15. Reading 1.9.25, it selected Compose
1.5.15, which refuses to run against the 1.9.24 compiler actually in use and
fails the build at `:expo-modules-core:compileReleaseKotlin`.

Declaring `android.kotlinVersion: "1.9.24"` in `expo-build-properties` fixes it
at the source: the property and the pin now agree, and the matching Compose
compiler 1.5.14 is selected. 1.9.24 is chosen over 1.9.25 deliberately — it is
the version React Native actually resolves, so it stays consistent even if
something else on the classpath holds the plugin down.

## Cleartext HTTP is allowed, for now

Android 9 and later block cleartext traffic by default, and loopback is **not**
exempt. A release build therefore could not reach an API on
`http://127.0.0.1:4000` at all — every request failed before it left the device.
Development builds never showed this, because their debug manifest sets
`usesCleartextTraffic` itself.

`expo-build-properties` sets it explicitly. This is a deliberate concession to
the current setup, where the API is served over plain HTTP beside the app. It
should be removed once the API is served over HTTPS, which is the point of
moving to Supabase.

## Android: one ABI, not four

React Native ships prebuilt native libraries for four ABIs, so by default an
APK carries four copies of every `.so` file. Measured from the first preview
APK (99,324,354 bytes), they were 80.6% of it:

| ABI | compressed | share of APK |
|---|---|---|
| `arm64-v8a` | 20,905,536 | 21.0% |
| `x86_64` | 22,273,472 | 22.4% |
| `x86` | 21,875,332 | 22.0% |
| `armeabi-v7a` | 15,048,392 | 15.2% |

`x86` and `x86_64` are emulators, and `armeabi-v7a` is 32-bit, which no Android
device capable of running this app is. Building them costs every user who
downloads the APK roughly 59 MB for no benefit.

The build is therefore restricted to `arm64-v8a`, which takes the APK to around
38 MB — a 60% reduction.

This is written as a local config plugin, `apps/mobile/plugins/withAndroidBuildArchs.js`,
rather than as a property of `expo-build-properties`. The SDK 52 release of that
plugin (0.13.3) has no architecture option at all; its `buildArchs` property
arrived with a later SDK. A local plugin adds no dependency and cannot drift
from the SDK version.

The plugin writes `reactNativeArchitectures` to `android/gradle.properties`,
which the React Native Gradle plugin reads through `PropertyUtils` and applies
as `ndk { abiFilters }` in `NdkConfiguratorUtils`. That path only runs when the
New Architecture is enabled, which `app.json` sets, so the setting is live.

The list stays in `app.json`, so widening it is a one-line edit:

```json
["./plugins/withAndroidBuildArchs", { "archs": ["arm64-v8a", "x86_64"] }]
```

One consequence to revisit before publishing to Google Play: the `production`
profile builds an `.aab`, and Play generates per-device downloads from whatever
ABIs the bundle contains. An arm64-only bundle is right for every phone in the
target market but would exclude a 32-bit-only device, so if that coverage ever
matters, add `armeabi-v7a` back for the production profile.

## Tags: `v1.phase.step`

Each phase is committed in steps, and every step is tagged. The tag names the
step: `v1.1.3` is phase 1, step 3. Tag messages carry the tag name.
