# Roadmap

Work is organised into phases. Each phase is a shippable milestone and is
tagged when it is verified. Phases do not map to folders; touching two folders
in one phase is still one phase.

| Phase | Scope | Tag |
|---|---|---|
| 0 | Scaffold: structure, dependencies, tooling, TypeScript | `v0.1.0` |
| 1 | Data model and RSS ingestion end to end | `v0.2.0` |
| 2 | Public API: feed, items, sources, search | `v0.3.0` |
| 3 | Mobile screens for the news feed | `v0.4.0` |
| 4 | Podcasts: discovery, ingestion, player | `v0.5.0` |
| 5 | Accounts, follows, bookmarks, notifications | `v1.0.0` |

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

### Accounts, follows and notifications

Not required to prove the ingestion pipeline. Bookmarks are stored on the
device until accounts exist. Supabase Auth is the likely provider; see
[`DECISIONS.md`](DECISIONS.md).
