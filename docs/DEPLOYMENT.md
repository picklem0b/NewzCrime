# Deployment

The production setup is built to cost nothing: Supabase holds the data, Render
runs the API, GitHub Actions builds the APK and runs ingestion. No component
requires a credit card on the free tier.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

## 1. Database

Supabase is the primary database. Create a project, then take two connection
strings from **Project settings → Database → Connection string**:

| Variable               | Port | Used by                          |
| ---------------------- | ---- | -------------------------------- |
| `DATABASE_URL`         | 6543 | The API (transaction pooler)     |
| `DATABASE_URL_DIRECT`  | 5432 | Migrations, the worker, pg-boss  |

The two are not interchangeable. pg-boss needs `LISTEN/NOTIFY`, which the
transaction pooler does not support; using the pooled URL for the worker gives
a queue that never runs. The API runs migrations at boot, so it also needs the
direct URL.

### Render Postgres as a fallback

Render's free managed Postgres is not offered to every account. If Supabase is
not an option, create a Render Postgres on whatever plan is available and paste
its connection string into **both** variables. Nothing in the code changes.
Do not add a `databases:` block to `render.yaml` unless the account can create
one — a blueprint that declares an unavailable plan fails the whole deploy.

## 2. Cache

Upstash Redis has a free tier and a TCP endpoint (`rediss://` for TLS). Set
`REDIS_URL` to it. The API degrades to an in-process cache when the URL is
unreachable or empty, so this is optional; the only cost of skipping it is that
each API instance caches alone.

## 3. API on Render

1. Push the repository, then **New → Blueprint** and select `render.yaml`.
2. Render asks for the three `sync: false` variables. Paste the database URLs
   and the Redis URL.
3. Deploy. The start command runs migrations first, then the API.
4. Check `https://<service>.onrender.com/health`. It reports the database and
   which cache backend is live.

The free instance sleeps after idleness and wakes on the first request. Two
things in the API are sized for that: the connection pool defaults to five, and
public reads send `stale-while-revalidate` so a waking instance can answer from
a cached page while it refreshes.

## 4. Ingestion

Render background workers are paid-only, so ingestion runs on GitHub Actions
(`.github/workflows/ingest.yml`) every two hours. Add these repository secrets:

- `DATABASE_URL_DIRECT`
- `REDIS_URL`
- `PODCAST_INDEX_API_KEY` / `PODCAST_INDEX_API_SECRET` (optional)

Run the workflow manually once after the first deploy to fill an empty database.

## 5. Android builds

`.github/workflows/android-build.yml` builds with Gradle, not EAS, so it spends
no EAS build credits. It needs the release keystore:

| Secret                       | Value                                   |
| ---------------------------- | --------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`    | `base64 -w0 release.keystore`            |
| `ANDROID_KEYSTORE_PASSWORD`  | keystore password                        |
| `ANDROID_KEY_ALIAS`          | key alias                                |
| `ANDROID_KEY_PASSWORD`       | key password                             |

Set the repository variable `API_URL` to the Render URL; it is inlined as
`EXPO_PUBLIC_API_URL`.

Every build must use the **same keystore**. The app downloads the new APK and
hands it to Android's installer, and Android refuses an upgrade signed by a
different key. A debug-signed build cannot replace a release build.

Push a `v*` tag to attach the APK to a GitHub Release as `newzcrime.apk`, which
is the URL the update check points at. Run the workflow manually to get a build
without tagging.

## 6. App environment

Only `EXPO_PUBLIC_*` variables reach the app, and they are inlined at build
time. `EXPO_PUBLIC_API_URL` is the only one required in production.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

## What is deliberately absent

- **A declared Render database.** It turns a free deploy into a payment prompt
  on accounts without the free plan.
- **A declared Render Key Value.** Same reason; the API tolerates its absence.
- **A paid worker.** GitHub Actions runs the same one-shot ingest.
- **EAS builds for routine releases.** Gradle in CI produces the same APK.
