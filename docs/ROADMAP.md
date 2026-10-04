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
| 7 | Accounts, follows, bookmarks sync, notifications | — | Not started |

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

### SAFLII judgments as `court_ruling`

SAFLII does not publish an RSS feed, so judgments are not in the first release.
GroundUp's court reporting is ingested, but it is classified as reporting rather
than as a ruling. Adding real judgments means either an adapter over SAFLII's
site structure or their bulk data, and is the single change that would most
strengthen the product's differentiator.

### Accounts, follows and notifications

Not required to prove the ingestion pipeline. Bookmarks and settings are stored
on the device until accounts exist. Supabase Auth is the likely provider; see
[`DECISIONS.md`](DECISIONS.md).

### Two inactive sources

Daily Maverick and News24 are seeded switched off because their feeds refuse or
do not resolve from this host. Enable them (`is_active = true`) where they are
reachable, and re-check the URLs first — both publishers change feed paths.
