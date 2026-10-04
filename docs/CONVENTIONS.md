# Conventions

## File naming

A file's name states what kind of thing it is. The table is enforced by review,
not by tooling.

| Kind | Convention | Example |
|---|---|---|
| Folders | lowercase | `settings/`, `adapters/` |
| Components | `PascalCase.tsx` | `FeedCard.tsx` |
| Screens | `PascalCase.tsx` | `Home.tsx`, `ItemDetail.tsx` |
| Hooks | `useSomething.ts` | `useSettings.ts` |
| Stores | `something.store.ts` | `settings.store.ts` |
| Types | `types.ts` | `src/types.ts` |
| Constants | `constants.ts` | `settings/constants.ts` |
| Utilities | `something.ts` | `styling.ts` |
| Tests | `something.test.ts` | `rssAdapter.test.ts` |
| Routes | Expo Router convention | `app/tabs/Home.tsx` |
| Services | `somethingService.ts` | `feedService.ts` |
| Adapters | `somethingAdapter.ts` | `rssAdapter.ts` |
| Middleware | `somethingMiddleware.ts` | `authMiddleware.ts` |
| Schemas | `something.schema.ts` | `feedQuery.schema.ts` |
| API clients | `somethingClient.ts` | `apiClient.ts` |
| Repositories | `somethingRepository.ts` | `sourceRepository.ts` |
| Config | `something.ts` | `env.ts` |
| Barrel exports | `index.ts` | `packages/shared/src/index.ts` |

Rules that follow from the table:

- **Folders name their contents.** `common/`, `lib/`, `misc/` and `store/` are
  not names; `components/feed/`, `stores/` and `utils/` are. A folder is not
  named for what it might hold later.
- **No symbols in names we author.** No `_`, `+` or `-`, and no mixed
  camelCase and snake_case.
- **Routes are framework-owned.** Inside `src/app/` the router decides file
  names, so the table does not apply there.
- **Barrels are `index.ts` and contain nothing else.** A file with logic is not
  a barrel.

### Framework exceptions

Inside `src/app/` only:

- `_layout.tsx` — expo-router requires layout files to start with `_`.
- `+not-found.tsx` — the catch-all route must start with `+`.

### Dynamic routes

expo-router supports bracket filenames such as `[id].tsx` for dynamic segments.
This project uses static routes and query parameters instead:

```ts
router.push({ pathname: '/detail/ItemDetail', params: { itemId } });
```

The trade-off is a URL of the form `/detail/ItemDetail?itemId=42` rather than
`/detail/42`.

## TypeScript

All app, API, worker and package code is TypeScript in strict mode. Each
workspace exposes a `typecheck` script and `pnpm typecheck` runs them all.

`tsconfig.base.json` is the source of truth for compiler options. Relevant
settings:

- `strict` and `noUncheckedIndexedAccess` — indexed access returns
  `T | undefined`, so the compiler requires the check the runtime already
  needed.
- `verbatimModuleSyntax` — type-only imports must be written as
  `import type { … }`, which keeps the emitted output predictable.
- `moduleResolution: "Bundler"` — imports are extensionless (`./types`), as
  Metro and `tsx` expect.

The mobile app extends `expo/tsconfig.base` and adds the `@/*` path alias for
`src/*`.

## Type organisation

A type lives in the file that describes it, and that file exports only types. A
reader should be able to open one file and see the whole shape of a thing.

- `packages/shared/src/types.ts` — the domain model shared by the API, worker
  and app: `Source`, `ContentItem`, `NormalizedItem`, `Paginated<T>`. Contains
  no runtime values.
- `packages/shared/src/constants.ts` — the runtime values that fill those
  types. Each object is declared with `as const satisfies Record<string, TheType>`
  so values cannot drift from the type.
- `packages/shared/src/apiClient.ts` — the client contract.
- `apps/mobile/src/types.ts` — every shape the app declares for itself,
  including settings. There is one `types.ts` per workspace and no module-local
  type files in the app.
- Types that cross the network live in `packages/shared`. A `Source` is imported,
  never redeclared in the app.
- Backend services keep a `types.ts` for process contracts such as config and
  adapter interfaces. Request and response shapes still come from
  `packages/shared`.

Types have no runtime representation; the compiler erases them. That is why
values live in `constants.ts` and shapes live in `types.ts`.

## Where code goes

### `apps/mobile/src`

```
app/            expo-router routes only
  index.tsx  _layout.tsx
  auth/         Welcome · LoginSheet · RegisterSheet
  tabs/         _layout · Home · Discover · Saved · Settings
  search/       Search
  detail/       ItemDetail · SourceDetail
  player/       Player
components/     reusable UI, grouped by domain
  feedback/   loading, empty and error states
  feed/       story cards, headline rows, topic chips
  layout/     screen container and header
  player/     mini player
  podcast/    show cards and episode rows
constants/      index.ts (barrel) + theme.ts
feed/           constants.ts: feed topic options
hooks/          useSomething.ts
stores/         something.store.ts
services/       somethingService.ts
utils/          something.ts
settings/       settings module: constants, screen, components, sections
types.ts        every type the app declares
```

Three rules that are easy to get wrong:

- **Only routes in `src/app/`.** expo-router treats every file there as a
  screen.
- **Stores and hooks are central.** Long-lived state is in `src/stores`; reused
  hooks are in `src/hooks`. A module owns its domain, not its store, which is
  why the settings store is at `src/stores/settings.store.ts` rather than inside
  `src/settings/`.
- **A `.store.ts` file contains no JSX.** The settings store is a zustand store,
  so no provider wraps the root layout.

### `services/api/src`

```
app.ts          express app factory
index.ts        entrypoint
types.ts        process contracts
config/         env.ts
middleware/     somethingMiddleware.ts
routes/         somethingRouter.ts
services/       somethingService.ts
cache/          cache helpers
tests/          something.test.ts
```

### `services/worker/src`

```
index.ts        entrypoint
types.ts        adapter and config contracts
config/         env.ts
adapters/       somethingAdapter.ts
jobs/           somethingJob.ts
queue/          pg-boss setup
utils/          something.ts
tests/          something.test.ts
```

### Packages

```
packages/shared/src/    index.ts · types.ts · constants.ts · apiClient.ts
packages/db/src/        index.ts · database.ts · types.ts   (+ scripts/migrate.ts)
```

## Commits

Conventional Commits, imperative mood, scoped:

```
feat(home): add court and crime filter chips
fix(worker): retry a refused feed fetch instead of dropping the job
docs(scope): record why audiobooks are deferred
```

- The scope is the area touched: `mobile`, `api`, `worker`, `db`, `shared` or
  `docs`.
- The body explains why, wrapped at around 72 characters.
- Commits carry no co-author or tool attribution footers.

## Versioning and tags

A tag names the phase and the step within it: `v1.PHASE.STEP`.

- `v1.0.0` is the scaffold.
- `v1.1.1` is phase 1, step 1; `v1.3.4` is phase 3, step 4.
- A step is tagged when the repository typechecks and the step's behaviour has
  been verified against a real database, not only by inspection.

Tag messages start with the tag name, so `git tag` output and release notes
read consistently:

```bash
git tag -a v1.3.2 -m "v1.3.2: ingest jobs"
```

A breaking API or schema change is a step of its own rather than being folded
into another, so a reader can find the commit that changed the contract.

## Tooling

- Node services run TypeScript directly through `tsx`, with no build step.
- `pnpm typecheck` runs `tsc --noEmit` in every workspace.
- Expo tooling compiles the app; `pnpm --filter ./apps/mobile typecheck` checks
  it standalone.
