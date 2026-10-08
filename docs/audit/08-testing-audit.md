# 08 — Testing Audit

## Current state

`pnpm -r test` — **276 tests across 24 files, all passing**.

| Workspace | Files | Tests | Focus |
|---|---|---|---|
| `packages/shared` | 2 | 31 | API client (timeout, retry, error shapes), constants ↔ types |
| `packages/cache` | 1 | 10 | key prefixing, TTL, `delByPrefix` on both backends |
| `packages/db` | 1 | 10 | cursor encode/decode edge cases |
| `apps/mobile` | 11 | 105 | stores, services, utils, feed layout/constants |
| `services/api` | 4 | 53 | query schemas, cache keys, env validation |
| `services/worker` | 5 | 67 | RSS + SAFLII adapters, classification, text, ingest job |

Tests live in sibling `__tests__/` directories; source and test filenames
follow the documented conventions.

## What is genuinely covered

- **Adapters** (34 tests) run against real fixtures (`rssAdapter.fixture.ts`,
  `safliiAdapter.fixture.ts`) — dates, GUID fallback, HTML stripping, image
  and author extraction, enclosure → `audioUrl`.
- **Validation** (23 tests) covers the feed and search schemas including
  bounds (`limit` clamp) and coercion.
- **Config** (18 tests) covers every env branch including `TRUST_PROXY`
  parsing and the fail-fast message.
- **Cursor** (10 tests) covers malformed input returning `null`.
- **Cache** (10 tests) covers the prefix contract that `delByPrefix` depends
  on — the bug class that would silently serve stale pages.
- **Update service** covers `latestRelease` and `isUpdateAvailable`
  including the unreadable-version guard.
- **Settings store** now covers hydration of corrupt/unknown values
  (added this pass, alongside the crash fix).

## Gaps

| # | Gap | Why it matters | Priority |
|---|---|---|---|
| T1 | No API route **integration** tests (supertest-style against `createApp`) | Route + middleware + error-shape behaviour is only unit-tested at the schema level | High |
| T2 | No mobile component/navigation tests | Screen wiring, tab registration, error boundary are unverified by test | Medium |
| T3 | No end-to-end ingest → API test | Cross-system contract (worker write → feed read) unverified as a whole | Medium |
| T4 | No failure-mode test with a live DB down | 503 path is reasoned, not exercised | Medium |
| T5 | No dependency-audit/security test in CI | See `06` S4 | Low |

`apps/mobile` has no test renderer (`@testing-library/react-native`) or
`jsdom`/`react-test-renderer` configured, so component tests would need a
dev-dependency added first. That is a deliberate decision to make, not a
silent one.

## Conducted in this pass

- Reproduced the settings crash with a minimal stub store before/after.
- Exercised the update-service guard via its unit tests (the fix added no
  new test file; existing coverage asserts the guard path).
- Ran `pnpm -r typecheck` and `pnpm -r test` after every change group.

## Not conducted (and why)

- **On-device UI verification** — no emulator/device in this environment.
  Stated plainly rather than implied.
- **Database-independent query-plan tests** — Postgres was down during the
  audit; the plan claims are reasoned from indexes, not measured.
- **Load / soak testing** — no harness, and source count (~16) does not
  justify it yet.

## Verdict

Unit coverage is strong where logic is pure (adapters, schemas, cursor,
cache, config) and touches real fixtures. The meaningful gaps are the
higher tiers — integration, component, and cross-system — plus the
missing test-runner setup for components. These are named above as concrete
next actions rather than left as a percentage.
