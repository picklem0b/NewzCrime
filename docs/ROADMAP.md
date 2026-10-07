# Roadmap

Work is organised into phases. Each phase is committed in steps, and every step
is tagged `v1.phase.step` — `v1.1.3` is phase 1, step 3.

| Phase | Scope | Tags | State |
|---|---|---|---|
| 0 | Scaffold: structure, dependencies, tooling, TypeScript | `v1.0.0` | Done |
| 1 | Environment validation, database layer, schema, seed | `v1.1.1`–`v1.1.4` | Done |
| 2 | Cache client | `v1.2.1` | Done |
| 3 | RSS ingestion, jobs, pg-boss scheduling | `v1.3.1`–`v1.3.4` | Done |
| 4 | Public API: feed, items, sources, podcasts, search | `v1.4.1`–`v1.4.3` | Done |
| 5 | Mobile app: feed, discover, saved, podcasts, settings | `v1.5.1`–`v1.5.5` | Done |
| 6 | Verification and documentation | `v1.6.1` | Done |
| 7 | SAFLII court judgments as `court_ruling` | `v1.7.1`–`v1.7.3` | Done |
| 8 | Accounts, follows, bookmarks sync, notifications | — | Not started |
| 9 | UI/UX rebuild: design system, editorial feed, Search tab, Library | `v1.9.1` | Done |

## Deferred work

Each entry records what it would cost to adopt; none are rejected. The
constraints behind them are in [`PRODUCT.md`](PRODUCT.md).

### YouTube video

Deferred because of quota, not effort. YouTube's `search.list` has a small daily
budget shared across every user of an API key, which makes keyword search
unusable. The workable design is to curate a fixed list of South African news
and court channels and poll their uploads playlists, since playlist and video
lookups are inexpensive. Playback requires the embedded player, which on native
means a WebView rather than a direct video stream.

### Live streams

The same quota problem, plus the need to poll to keep a stream's status
accurate. The first option is to deep-link out to the provider's app.

### Audiobooks

Public-domain catalogues such as LibriVox are freely usable, but the audiobooks
that would interest this audience are commercial and not licensable. Either ship
a labelled public-domain section or omit the feature.

### Newsletters and papers

There is no machine-readable source. Ingesting email requires an inbound mail
pipeline and parsing arbitrary HTML, and it would be done one publisher at a
time.

### SAFLII judgments: delivered in phase 7

This was recorded as the change that would most strengthen the product's
differentiator, and it turned out to be cheaper than expected. The first-release
note said SAFLII publishes no RSS feed; that was wrong. It publishes one per
court, at `/cgi-bin/rss_feed.cgi?path=za/cases/<COURT>`, and those are now
ingested as `court_ruling` by `safliiAdapter`. See [`SOURCES.md`](SOURCES.md).

GroundUp's court reporting is still ingested, and still classified as reporting.
The two are complementary: the adapter supplies the judgment, the reporting
supplies the context around it.

What remains unproven is the live fetch: SAFLII answers this development host
with a Cloudflare `403`, so the parser is verified against a recorded feed and
the persistence path against that same recording. The first deployment on an
ordinary host will be its real test.

### Running the app on a device

Delivered in phase 8. The app bundles and typechecks, but it had never run on a
device, and the reason turned out not to be the app: pnpm's isolated
`node_modules` stopped Metro from resolving `expo-asset`, so the bundler failed
before it started. That is fixed, and the bundle now builds — 4,495 modules, and
a 7 MB development bundle served over Metro.

What is still unverified is the app on a screen. There is no emulator and no
device attached to this development host, so the phase is verified by a successful
bundle and by typecheck. The first `eas build` and the first launch are the real
test, and no amount of local checking substitutes for them.

One artefact is worth knowing about: `expo export` cannot finish on this host
because the Hermes compiler shipped with React Native is a prebuilt x86-64 Linux
binary and this host is ARM, so it exits with `SIGILL`. It is a local limitation
only — EAS compiles on x86-64 runners — and it does not affect the development
bundle, which is what a dev client loads.

### The audit before the first install

Rather than wait for the first launch to find out, every screen, hook, store and
service was read end to end and the states that break a first run were fixed:

- **Error states now offer a retry.** The hooks already exposed `reload`, but
  the screens discarded it, so a failed fetch left a dead end.
- **`RefreshControl` was wired to a constant.** Pull-to-refresh showed a spinner
  that never moved.
- **The Settings tab had no safe area**, unlike every other tab.
- **Speech lived in a hook per row**, so the feed recycling a row stopped
  playback mid-sentence. It is now a store, with a guard against the native
  layer firing a replaced utterance's `onStopped` late.
- **A podcast with no audio was detected as playable**, because `null` and the
  empty string meant the same thing to the check.
- **A route asking for episodes with an empty id** fired a request that could
  only fail.
- **Accessibility labels read `"PauseIcon episode"`** — a find-and-replace
  artefact. They now say `Pause episode`.
- An error boundary and a `+not-found` route were added, so an unexpected crash
  or an unknown link no longer leaves a blank screen.
- Dead helpers (`utils/styling.ts`) were removed.

The backend was verified live rather than by reading: migrations applied, one
real ingest run (29 sources, 37 items inserted, 13 failed — all SAFLII `403`s
from the Cloudflare challenge above), then every endpoint exercised against the
running API. `/health`, `/v1/feed` (with every topic and `includePodcasts`),
`/v1/sources`, `/v1/podcasts`, `/v1/search` and `/v1/app/version` all answer
`200`; a bad topic `400`s with a field-level message; an unknown item and an
unknown route both `404`. The ingest run completing with 13 failures is the
partial-success design working, not an error.

The app itself still has not been seen on a screen. That limitation is unchanged
and is stated above rather than worked around.

### Accounts, follows and notifications

Not required to prove the ingestion pipeline. Bookmarks and settings are stored
on the device until accounts exist. Supabase Auth is the likely provider; see
[`DECISIONS.md`](DECISIONS.md).

### Two inactive sources

Daily Maverick and News24 are seeded switched off because their feeds refuse or
do not resolve from this host. Enable them (`is_active = true`) where they are
reachable, and re-check the URLs first — both publishers change feed paths.
