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

`sources.type` says how a source is fetched (`rss`). `sources.content_type` says
what its items are (`article`, `court_ruling`, `podcast_episode`). One column
could not express both: a podcast show is fetched over RSS but produces
episodes, and the feed needs to distinguish them.

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

## Tags: `v1.phase.step`

Each phase is committed in steps, and every step is tagged. The tag names the
step: `v1.1.3` is phase 1, step 3. Tag messages carry the tag name.
