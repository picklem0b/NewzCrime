# 10 — Audit Change Log

Every meaningful change made during the production-readiness audit. Grouped
by pass. Author attribution follows the repository rule: the human owner, no
agent footer.

## Pass 1 — Discovery & fixes

### `apps/mobile/src/stores/settings.store.ts` (fix)
Validate persisted settings instead of casting them. Added `idsOf`,
`isOneOf`, `asBoolean`; `withDefaults` now checks `colourMode`, `textSize`,
`startTab`, and the four boolean flags against their allowed values, and
migrates the legacy `discover` start tab. Root cause of an app-wide crash:
an unrecognised `colourMode` made `palettes[scheme]` `undefined`, so
`useTheme()` threw on every screen.

### `apps/mobile/src/stores/__tests__/settings.store.test.ts` (test)
Six tests covering corrupt / unknown / wrong-type stored values and the
round-trip of valid ones (19 tests in the file).

### `services/api/src/app.ts` (fix)
- `trust proxy` now reads `config.trustProxy` instead of a hardcoded `1`.
- CORS: an empty allow-list denies cross-origin reads in production and
  reflects only in development.

### `services/api/src/config/env.ts` (fix)
Added `TRUST_PROXY`, validated as `true` / `false` / digits, with a readable
failure message; `parseTrustProxy` converts it to `boolean | number`.

### `services/api/src/types.ts` (docs + types)
Added `trustProxy: boolean | number` to `ApiConfig`; corrected the
`corsOrigins` comment to describe actual behaviour.

### `services/api/src/config/__tests__/env.test.ts` (test)
Four tests for the `TRUST_PROXY` default, `true`, hop count, and rejection of
an uninterpretable value (18 tests in the file).

### `.env.example` (docs)
Documented `TRUST_PROXY`, including why the default does not trust a proxy.

## Pass 2 — Verification

No source changes. Re-ran typecheck (6/6), all 276 tests, mobile lint
(clean), a production boot with Postgres and Redis unreachable, and a
curl sweep of `/health`, `/v1/app/version`, data routes, invalid input, an
unknown route, security headers and CORS. All results recorded in `09`.

## Pass 3 — Fresh-eyes review & fixes

### `apps/mobile/src/stores/settings.store.ts` (fix)
The doc comment describing `withDefaults` had attached to
`migrateStartTab`; moved onto the declaration it describes.

### `apps/mobile/src/stores/__tests__/settings.store.test.ts` (fix)
Removed six duplicated `await import('../../settings.store')` calls inside
individual tests; `withDefaults` is imported once at the top with
`useSettingsStore`, and the tests are no longer `async`.

### `apps/mobile/src/services/updateService.ts` (fix)
`checkForUpdates` now calls `isUpdateAvailable` instead of comparing
versions directly, so the version-format guard is single-sourced and the
"Check for updates" row cannot disagree with the "Get the update" button.

## Audit deliverables

- `docs/audit/01-repository-overview.md`
- `docs/audit/02-code-quality.md`
- `docs/audit/03-mobile-audit.md`
- `docs/audit/04-backend-audit.md`
- `docs/audit/05-database-audit.md`
- `docs/audit/06-security-audit.md`
- `docs/audit/07-performance-audit.md`
- `docs/audit/08-testing-audit.md`
- `docs/audit/09-production-readiness.md`
- `docs/audit/10-change-log.md`

## Not changed (deliberately)

- **Auth screens** — unwired by instruction; the `TODO` markers stay.
- **`useFeed.loadMore` swallow** — changing it alters UI behaviour;
  recorded as L1 rather than changed without product input.
- **Duplicate Settings route** — resolved by the planned top-right move;
  recorded as L3.
- **`usesCleartextTraffic` / default base URL / icon+splash** — owner
  decisions; reported as H1–H3 with the exact fix, not applied unilaterally.

## Verification after every group

`pnpm -r typecheck` and `pnpm -r test` were run after each change group; the
final state is 6/6 workspaces clean and **276 tests passing**.
