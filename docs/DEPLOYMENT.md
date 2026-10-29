# Deployment

The production setup is built to cost nothing: Supabase holds the data, Render
runs the API, GitHub Actions builds the APK and runs ingestion. No component
requires a credit card on the free tier.

= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

## 1. Database

Supabase is the primary database. Create a project (Frankfurt is the closest
free region to South Africa), then open **Project settings → Database →
Connection string → URI** and copy the two pooler strings:

| Variable               | Supabase pooler | Port | Used by                          |
| ---------------------- | --------------- | ---- | -------------------------------- |
| `DATABASE_URL`         | Transaction     | 6543 | The API (reads)                  |
| `DATABASE_URL_DIRECT`  | Session         | 5432 | Migrations, ingestion, pg-boss   |

Append `?sslmode=require` if the copied string does not already carry it. The
driver also turns TLS on for any non-local host, so Supabase works even when the
parameter is missing, but keeping it explicit documents the requirement.

Use the **session pooler** for the direct URL rather than `db.<ref>.supabase.co`:
newer Supabase projects expose that host over IPv6 only, and neither GitHub
runners nor some Node hosts have an IPv6 route. The session pooler is IPv4 and
supports the `LISTEN/NOTIFY` that pg-boss needs.

The two are not interchangeable. The transaction pooler does not hold a session,
so pg-boss and migrations must use the session URL. The API runs migrations at
boot, so it needs the direct URL too.

### Prove the connection

Before wiring Render or Actions, fill both URLs in `.env` and run from the
repository root:

```bash
pnpm db:setup     # apply migrations, seed sources, print host and row counts
pnpm ingest       # one ingest run against the same database
pnpm db:verify    # sources > 0 and items > 0
```

`db:verify` never prints the password or the full URL. It reports the host,
whether TLS is on, the latest migration and the row counts, which is the
quickest way to tell an empty database from a database the app is not reaching.
`pnpm db:verify --strict` exits non-zero when `content_items` is empty, so it can
guard a deploy.

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
The workflow now fails at a named "Check the database secret" step when
`DATABASE_URL_DIRECT` is absent, instead of failing later inside the worker with
an environment error.

## 4b. When the app says "No stories here yet"

Work through these in order; each one rules out a different layer.

1. `curl https://<service>.onrender.com/health` — `"database": true` means the
   API is connected. A `503` or `"database": false` is the API's pool, not the
   app.
2. `pnpm db:verify` against the same URL the API uses. `sources 0` means the
   migrations never ran; `items 0` means ingestion never ran.
3. Open **Actions → Ingest feeds**. If the run is red, read the failing step. If
   it never ran, the schedule is only active on the default branch and the
   `DATABASE_URL_DIRECT` secret must exist on that repository.
4. Run the workflow manually. A successful run logs `inserted` counts and the
   API's feed is non-empty on the next request.

Empty pages are deliberately sent with `Cache-Control: no-store`. Before that
change the app cached an empty page for five minutes and could keep showing it
for another twenty through `stale-while-revalidate`, which made a freshly
filled database look broken.

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
