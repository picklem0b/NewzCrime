# Decisions

Technical decisions that are settled, with the reasoning that led to them.
Entries are added when a decision is made, not when it is implemented.

## Platform: Expo / React Native

Chosen over Flutter and over a web app wrapped with Capacitor.

- **Flutter** uses Dart, a separate language and toolchain from the JavaScript
  already used across the rest of the project.
- **Capacitor** reuses web skills, but the demanding parts of this app are
  native: background audio, lock-screen controls and downloads. It also risks
  App Store rejection under guideline 4.2, which targets apps that are
  web content in a wrapper.
- **React Native with Expo** shares one language with the API and worker and has
  maintained native audio and notification libraries.

## Language: TypeScript

The whole workspace is TypeScript in strict mode. Types are erased at runtime;
the compiler catches mistakes before execution. `tsconfig.base.json` is the
source of truth and each workspace extends it.

## Ingestion: RSS before any API

The first release ingests RSS only. RSS requires no API key, no quota and no
publisher agreement, and it exercises the full pipeline: fetch, normalise,
de-duplicate, store, cache, serve, render. Adding a second vertical afterward
reuses that pipeline instead of extending it.

## Background audio: react-native-track-player

`expo-audio` plays audio in the background but does not expose lock-screen
control callbacks. A podcast app that cannot be paused from the lock screen does
not meet the requirement, so the app uses `react-native-track-player`.

The cost is a native module: Expo Go no longer runs the app. The switch to a
development build happens at the first release rather than later.

## Job queue: pg-boss in Postgres

pg-boss stores its queue in Postgres, so no additional service is required.
Alternatives such as BullMQ need Redis blocking commands, which Upstash's REST
interface does not provide.

Because pg-boss depends on `LISTEN/NOTIFY`, the worker connects on port 5432,
never the Supabase transaction pooler on 6543. See
[`ARCHITECTURE.md`](ARCHITECTURE.md).

## Database: Postgres, Supabase in production

Supabase is Postgres, so local development runs the same engine in Docker and
the schema is unchanged in production. It also provides Auth, Storage and
Realtime as options for later phases.

## Search runs against the local database

`GET /v1/search` queries stored items. It does not proxy a third-party search
API. Third-party API quotas are shared across every user of the app, and a
keyword search endpoint a user can trigger repeatedly would exhaust that quota.

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

## Versioning: semantic versioning

Tags are `vMAJOR.MINOR.PATCH`. A milestone is tagged when it ships and is
verified. See [`CONVENTIONS.md`](CONVENTIONS.md) for the details.
