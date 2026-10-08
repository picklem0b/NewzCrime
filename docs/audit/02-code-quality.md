# 02 — Code Quality & Type Safety

## Method

Static inspection of `apps/**` and `packages/**` source (excluding
`node_modules`) via ripgrep, plus `tsc --noEmit` across all six typed
workspaces.

## TypeScript

| Check | Command | Result |
|---|---|---|
| `any` | `rg '\bany\b'` in source | **0** occurrences |
| `@ts-ignore` / `@ts-expect-error` | `rg` | **0** |
| eslint-disable | `rg` | **1**, justified inline |
| Non-null assertions `!` | reviewed by grep | none in hot paths |
| Typecheck | `pnpm -r typecheck` | **6/6 clean**, 0 errors |

The type system is doing real work here, not being bypassed:

- `satisfies` pins runtime constants to their types in
  `packages/shared/src/constants.ts`, so `CONTENT_TYPE`, `SOURCE_TYPE`,
  `TOPIC` and `ITEM_TOPIC` cannot drift from `./types`.
- Repositories map snake_case rows to camelCase contracts through an explicit
  `mapContentItem(row: ContentItemRow): ContentItem`, so database shape and
  API shape are separate named types rather than one cast.
- The API client distinguishes `ApiError` (HTTP status) from `TypeError`
  (network) from `AbortError` with type guards rather than casts.

## Dead / duplicated code

| Item | Finding |
|---|---|
| `TODO` comments | **2**, both in `app/auth/*Sheet.tsx`, intentionally unwired (auth is out of scope by instruction) |
| Debug logging | `console.log` only in `services/worker/scripts/verifySaflii.ts`, a manual script — not imported by runtime code |
| Duplicate `Settings` route | `app/settings/Settings.tsx` and `app/tabs/Settings.tsx` both render `@/settings/SettingsScreen`. Not dead, but redundant; see R4 |
| Superseded components | none imported and unreachable were found in this pass |

## Code quality positives

- **Separation of concerns is consistent.** Screens are thin routes under
  `src/app/**`; their bodies live in feature dirs (`home/`, `podcasts/`,
  `discover/`, `saved/`, `search/`) and `src/settings/SettingsScreen.tsx`.
- **Naming follows the documented conventions** (`.store.ts`, `useX.ts`,
  `xService.ts`, `xRepository.ts`, `x.schema.ts`).
- **Config validates at startup** (`loadApiConfig`) and throws a readable,
  multi-line message listing each bad variable.
- **No swallowed exceptions in critical paths.** The one deliberate silent
  catch in `hydrate()` is commented and falls back to defaults.

## Issues found and fixed this pass

### Q1 — `checkForUpdates` bypassed the version-format guard (Medium)

`isUpdateAvailable()` guards against unreadable version strings because
`compareVersions` maps a non-numeric part to `0`, which would make a build
whose version could not be read compare as `0.0.0` and be told to update
forever. The comment says so explicitly.

But the function the UI actually calls, `checkForUpdates()`, re-implemented
the comparison **without that guard**:

```ts
if (compareVersions(current, info.latestVersion) >= 0) { ... }
```

So the "Check for updates" row and the "Get the update" button could
disagree. Fixed by routing `checkForUpdates` through `isUpdateAvailable`, so
the guard is single-sourced.

### Q2 — `useFeed.loadMore` swallows failures (Low, recorded not changed)

```ts
.catch(() => undefined)
```

A failed *pagination* request leaves the user at the end of the loaded list
with no feedback and no retry. The first-page path reports errors properly;
only subsequent pages are silent. Changing this alters UI behaviour, so it is
recorded rather than changed without product input.

### Q3 — `fetchReleaseNotes().catch(() => undefined)` (Low, recorded)

The About panel silently shows nothing when the release call fails. Acceptable
(degrade to "no notes") but indistinguishable from "no notes exist". Recorded.

## Verdict for this phase

Code quality is **high** for a project at this stage: no `any`, no suppressed
errors, no debug residue, consistent conventions, and clean typecheck. The
defects found are small and specific rather than structural.
