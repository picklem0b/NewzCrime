# 06 — Security Audit

## Secrets

| Check | Result |
|---|---|
| `.env` files tracked in git | **No** — `.gitignore` excludes `.env` and `.env.*`, keeps `.env.example` |
| Hardcoded credentials/keys/tokens in tracked files | **None found** (pattern scan for `api_key/secret/password/token/bearer` followed by a ≥16-char literal) |
| Signing material | `.gitignore` excludes `*.jks *.keystore *.p8 *.p12 *.key *.mobileprovision` |
| Local Redis snapshot | `*.rdb` ignored (`dump.rdb` present on disk, not tracked) |
| Secrets in logs | pino logs request metadata and error stacks; **no** auth headers or bodies are logged |
| Secrets in client bundle | `apiService` reads only `EXPO_PUBLIC_API_URL`; no secret is exposed via `EXPO_PUBLIC_*` |

## Injection

- **SQL**: all queries use `$n` placeholders. No value is interpolated into a
  statement. `searchItems` binds the search term as `$1` even inside the
  `ILIKE` concatenation.
- **NoSQL**: none in use.
- **Command / path**: no shell execution and no user-controlled filesystem
  paths in API or worker code.
- **SSRF**: the worker fetches source URLs from the `sources` table (seed
  data), not from request input, so a client cannot drive a fetch. A request
  cannot choose an outbound URL.

## Transport & headers

- `helmet()` sets CSP, `X-Content-Type-Options`, HSTS, referrer policy, etc.
- `express.json({ limit: '100kb' })` bounds body size.
- **S1 — cleartext traffic enabled for production Android builds.**
  `app.json` → `expo-build-properties` → `android.usesCleartextTraffic: true`.
  This permits HTTP to any host. It is needed to talk to a local
  `http://127.0.0.1:4000` API during development, but should not ship. The
  production API should be HTTPS and this flag false (or restricted by
  network-security-config). Recorded as a release blocker.
- **S2 — default API base URL is plaintext `http://127.0.0.1:4000`.** On a
  physical device this is the device itself, so a build that forgets
  `EXPO_PUBLIC_API_URL` fails to reach the API. It also means the fallback is
  HTTP. Recorded (see `01` R2).

## Abuse / rate limiting

- Global `express-rate-limit` (`API_RATE_LIMIT_MAX` 300 / 60s), keyed on
  client IP.
- Correct `trust proxy` handling is what makes the limit real: with a proxy
  trusted that is not present, `X-Forwarded-For` would hand out a fresh
  bucket per request. The value is now validated and defaults to `false`.

## CORS

- Explicit origins win; with none, **production denies** cross-origin reads
  while development reflects. A deployment that forgets `CORS_ORIGINS` is
  closed, not open. (Behaviour confirmed against `app.ts`; a stale doc
  comment was corrected.)

## Authn / authz

- Auth is **out of scope by instruction** and the auth screens are unwired
  (`TODO` placeholders only). There is therefore no session surface to
  review yet.
- The API client already supports a bearer token via `getToken`, but no
  token store is wired — so today all endpoints are effectively public reads
  of curated content. That is consistent with the current product scope.

## Error information leakage

- Unknown errors return an opaque `{ error: 'internal_error' }`; stack
  traces go to the log only.
- Validation failures return per-field messages for **request shape**, not
  internal state.

## Dependency posture

- No dependency vulnerability scan was run in this environment (no network
  install). Versions are pinned in `pnpm-lock.yaml`; the direct dependency
  count is small. Recorded as an outstanding check (see `09`).

## Findings summary

| # | Finding | Severity | Status |
|---|---|---|---|
| S1 | `usesCleartextTraffic: true` ships to production | High | Recorded — must be cleared before release |
| S2 | Default API base URL is HTTP localhost | High | Recorded |
| S3 | No auth wired | Info | By instruction; endpoints are read-only curated content |
| S4 | Dependency vuln scan not executed here | Medium | Recorded |

## Verdict

No committed secrets, no injection surface, no SSRF, correct CORS defaults,
a rate limit that cannot be trivially bypassed, and no sensitive logging.
The two clear items — cleartext traffic and the plaintext default base URL —
are configuration, not code, and must be resolved at release time.
