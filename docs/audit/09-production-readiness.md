# 09 — Production Readiness

Audit run in three passes over the tree at `v1.12.8` plus the fixes recorded
here. Every claim below is backed by an observed result; anything not
verified is named as such.

- **Pass 1** — discovery, subsystem audit, first fixes.
- **Pass 2** — re-ran all checks, exercised failure modes end to end.
- **Pass 3** — fresh-eyes review of the changes themselves; fixed two
  self-introduced defects; final verdict.

## Verdict

> **NOT READY** for public production release.
> **READY** for internal / development distribution and further testing.

The code is in good shape — no correctness blockers were found in the API,
worker, database layer or mobile logic. What blocks *public* release is
configuration and product assets, not engineering: cleartext traffic is
enabled for Android, the default API URL is plaintext localhost, and the app
has no icon or splash. Each is a small, named fix.

## Issues

### Critical
_None found in code._

### High

| # | Issue | Where | Status |
|---|---|---|---|
| H1 | `android.usesCleartextTraffic: true` ships for all builds | `apps/mobile/app.json` | Open — needs production build property |
| H2 | Default API base URL is `http://127.0.0.1:4000`; a device build without `EXPO_PUBLIC_API_URL` cannot reach the API | `apps/mobile/src/services/apiService.ts` | Open — needs build-time URL |
| H3 | No app `icon` / `splash`; `assets/` holds only `.gitkeep` | `apps/mobile/app.json` | Open — asset pending (owner stated) |
| H4 | Settings injection crash: unvalidated persisted `colourMode` indexed `palettes` → every screen threw | `apps/mobile/src/stores/settings.store.ts` | **Fixed** |
| H5 | `checkForUpdates` bypassed the version-format guard, so the check and the update button could disagree | `apps/mobile/src/services/updateService.ts` | **Fixed** |

### Medium

| # | Issue | Status |
|---|---|---|
| M1 | `trust proxy` was hardcoded to `1`, allowing rate-limit bypass when no proxy is present | **Fixed** (configurable, default `false`, validated) |
| M2 | CORS reflected any origin when the allow-list was empty, in every environment | **Fixed** (production now denies) |
| M3 | `ApiConfig.corsOrigins` doc comment contradicted behaviour | **Fixed** |
| M4 | No API integration tests against `createApp` | Open (`08` T1) |
| M5 | Dependency vulnerability scan not run in this environment | Open |
| M6 | Query plans not measured at volume (Postgres down during audit) | Open |

### Low

| # | Issue | Status |
|---|---|---|
| L1 | `useFeed.loadMore` swallows pagination errors | Recorded |
| L2 | `fetchReleaseNotes` failure is indistinguishable from "no notes" | Recorded |
| L3 | Two routes render the same Settings screen | Recorded (resolved by planned top-right move) |
| L4 | `toFeedQuery` shared export unused by the router | Cosmetic |

## What was fixed this audit

1. **Settings injection crash** — `withDefaults` now checks each stored field
   against the ids the UI can set, type-checks booleans, migrates the
   `discover` → `search` start tab, and falls back to defaults. Reproduced
   the crash before the fix; 6 new tests added (19 total in that file).
2. **Update-check inconsistency** — `checkForUpdates` routes through
   `isUpdateAvailable`, single-sourcing the unreadable-version guard.
3. **Rate-limit bypass surface** — `TRUST_PROXY` is now a validated config
   value (`true` / `false` / hop count) defaulting to `false`, documented in
   `.env.example` and typed in `ApiConfig`.
4. **CORS fail-open** — production with no `CORS_ORIGINS` now denies
   cross-origin reads instead of reflecting the caller.
5. **Stale config doc comment** corrected to match behaviour.
6. **Self-introduced doc/import defects** found in Pass 3 and fixed (a doc
   comment attached to the wrong declaration; duplicated dynamic imports in
   tests).

## Tests performed

| Check | Command | Result |
|---|---|---|
| Typecheck | `pnpm -r typecheck` | **6/6 clean** |
| Unit tests | `pnpm -r test` | **276 pass / 24 files** |
| Lint | `expo lint` (mobile) | clean |
| Production boot (DB+Redis down) | `NODE_ENV=production` with unreachable DB/Redis | **starts**, degrades to memory cache, graceful SIGTERM |
| `/health` with DB down | curl | **503** `{status:'degraded',database:false,cache:'memory'}` |
| `/v1/app/version` | curl | **200** with release metadata |
| DB-down data routes | curl | **500** opaque `internal_error`, no stack leak |
| Invalid input | `?limit=99999` | **400** with per-field `details` |
| Unknown route | curl | **404** `{error:'not_found'}` |
| Security headers | curl in production | CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options` present |
| CORS | `Origin: https://evil.example`, no list, production | **no** `Access-Control-Allow-Origin` (blocked) |
| Fail-fast config | bad `LOG_LEVEL` | process exits with a readable list of issues |

## Build results

- Metro full graph: **4532 modules, 0 resolution errors**.
- Bundle fails only at `hermesc` (`SIGILL`) — the prebuilt `linux64` binary
  on ARM/Termux, not project code; EAS builds on x64.
- arm64-only ABI verified in the produced APK (single ABI, 23 native lib
  entries); `TrackPlayerModule` confirmed compiled into the dex.

## Security results

No committed secrets; `.env*` ignored; no SQL injection surface (all
parameterised); no SSRF (fetch URLs come from seed data); CORS now fails
closed in production; rate limit cannot be trivially bypassed; no sensitive
logging. Open: cleartext traffic (H1), plaintext default URL (H2), dependency
scan (M5).

## Performance findings

One bounded, indexed, cached query per read endpoint; no N+1. Cache hit skips
the database entirely; Redis failure degrades to memory. Mobile uses
FlashList, `expo-image` and scoped gradients. Unmeasured: query plans at
volume and cold-start timing (no live environment).

## What remains

| Item | Owner action |
|---|---|
| Production build property for cleartext (H1) | set `usesCleartextTraffic` false; use HTTPS API |
| Build-time `EXPO_PUBLIC_API_URL` (H2) | set per profile in `eas.json` |
| App icon + splash (H3) | supply assets, reference in `app.json` |
| API integration tests (M4) | add a supertest suite against `createApp` |
| Dependency scan (M5) | run `pnpm audit` in CI |
| Query-plan verification (M6) | run `EXPLAIN ANALYZE` against seeded data |
| Wire auth | explicitly out of scope by instruction |

## Explicit recommendation

**NOT READY for public production release.**
**READY for internal/dev distribution**, and the backend is ready to run
against a live Postgres + Redis. Clear H1–H3 and M5 and there is no
engineering reason this cannot go to production.
