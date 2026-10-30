# Changelog

NewzCrime is a reader for South African crime and court reporting: a live feed
from South African outlets, court judgments, and crime and true-life podcasts.

Every step in this repository is tagged `v1.PHASE.STEP`, and a step is tagged
only once it typechecks and its behaviour has been checked against a real
database. This file records what shipped, newest first, grouped by the phase
that carried it. Build and environment plumbing — hoisting `node_modules`,
EAS profile configuration, Kotlin pins, single-ABI trimming — is deliberately
left out; the tags remain the complete record. Dates are omitted because the
tags already order the work.

## 1.15 — search, follow, watch, and a first run that arrives ready

The largest phase: every feature, fix and chore below is its own step, numbered
in the 1.15.x line. There is no 1.15.0 — the phase opens at 1.15.1 and each
shipped change advances the last number.

**1.15.15** — Discover, grouped by medium.

- Discover is grouped into newsletters and sites, YouTube channels and podcasts,
  with the same follow control everywhere. Every source carries its province and
  shelf, so local and court channels are findable rather than buried in a list.
  Chips filter the screen to Following, YouTube, Podcasts or Newsletters.
- Following sits above the shelves: the newest stories, episodes and videos from
  every followed source render first, with a Manage shortcut.
- Every workspace and the app report version 1.15.15, and the release metadata,
  Android version code and changelog name the same release.

**1.15.14** — Follow any outlet, channel or show.

- The follow list is stored on the device. Watch gains a "From channels you
  follow" rail and Discover shows the latest items from every followed source.
- Search can restrict itself to followed sources, and each source row, channel
  tile and show tile carries the same follow control.

**1.15.13** — A search that finds channels, podcasts and video.

- Search returns video rows with thumbnails, channel results and podcast shows
  alongside stories and judgments, and the idle screen can jump straight to
  Watch, Podcasts, Discover and the rest of the app.

**1.15.12** — Advanced search.

- Filters narrow by topic, publication date, order and followed-only, with a
  single reset. Every option is one tap; there is no modal and no Apply button.

**1.15.11** — The Watch tab.

- Watch is a fifth tab: a lead video, live rails, true-crime files, courts and
  commissions, provincial updates and the channels behind them. The player lives
  on the detail screen with an Up next playlist, counts, the description and the
  original YouTube link. Nothing autoplays.

**1.15.10** — YouTube channels ingest.

- Watch sources are seeded with their province and shelf, and a YouTube adapter
  turns each channel's uploads into normalised items with thumbnails and counts.

**1.15.9** — A database you can diagnose.

- TLS is inferred for any non-local Postgres host, so a Supabase pooler URL works
  without extra configuration. `pnpm db:verify` prints the host, TLS state,
  migrations and row counts without revealing the password; `pnpm db:setup`
  migrates, seeds and verifies in one step. The ingest workflow fails with a
  named error when `DATABASE_URL_DIRECT` is missing.

**1.15.8** — An empty page is not kept.

- An empty feed, source page or search result is sent with `Cache-Control:
  no-store` and cached server-side for only 15 seconds, so a freshly filled
  database no longer looks broken for five minutes.

**1.15.7** — A first run that arrives ready.

- The feed and source directory are fetched while the introduction is on screen,
  and the last page is moved from disk into memory before the first tab renders.
  Today therefore paints stories instead of a skeleton, on the first run and on
  every cold start after it.

**1.15.6** — The introduction.

- A first launch opens on four illustrated cards: the news, podcasts, world
  events and court rulings, each with the supplied artwork on a cream disc, six
  floating icons and a caption. It is stored separately from the settings, so it
  appears once and Skip is remembered too.

**1.15.5** — CI and scheduled ingestion.

- CI typechecks and tests every workspace, ingestion runs on a schedule from
  GitHub Actions (the Render worker is paid-only), and the API deploys with
  Supabase as the primary database and Render Postgres as a documented fallback.

**1.15.4** — Today survives a tab switch and a cold start.

- Today caches its page in memory and on disk, so a tab switch is instant and a
  cold start with no network shows the last page instead of an error. The API
  sends `stale-while-revalidate`, keeps a five-connection pool and recycles
  keep-alive connections, which is what the free instance can sustain.

**1.15.3** — Updates install themselves.

- The update button downloads the APK and then asks whether to install it, with
  a banner when a build is waiting and a notification when alerts are allowed.
  "Later" snoozes that version for a day. The release URL is a direct APK,
  produced by the new Android build workflow rather than EAS.

**1.15.2** — More control over how the app reads.

- Settings grows from 7 to 49 values across Appearance, General, Reading &
  audio, Notifications, Data & privacy and About. Accent colour, headline face,
  density, quiet hours, text alignment, playback speed and the rest are applied
  immediately and validated on read, so a stored value from an older build cannot
  reach a component.

**1.15.1** — Search, rebuilt.

- Search has the same back header as Settings, an animated field, recent
  searches as a list, suggested queries and the outlet directory. Search history
  can be turned off, and turning it off clears what was stored.

## 1.14 — an app that installs itself, plays, and keeps search within reach

**1.14.4** — Search and settings sit at the top of every screen, and the date
line is gone.

- Both moved out of the tab bar and into a top bar that every tab renders, so
they are one tap away from wherever you are instead of somewhere you have to
leave to reach. Each opens as a screen with a back button. The tab bar holds
content only now: Today, Discover, Podcasts, Library — Discover takes the seat
Search gave up.
- Today no longer shows a dateline, and an article is aged the way a feed row is
— “2 hours ago” — rather than stamped with a date and a clock time.
- Two hidden routes existed only to keep search and settings out of the tab bar.
They are deleted rather than hidden, so there is one way into each screen.

**1.14.3** — Listening to an article uses a real device voice.

- Nothing named a voice before, so the platform picked one, and it picked a
robotic fallback. The app now resolves a voice when it starts — South African
English first, and the enhanced version of a voice over the plain one — and
reads slightly under the default speed.

**1.14.2** — Podcasts play.

- The player could never load. React Native's New Architecture reads a native
module's method annotations before the module exists, and the player's `add()`
returns a Kotlin coroutine, which it refuses to parse — so the app gave up on
the player before any podcast code ran. The app now runs the old architecture,
which the player supports.
- Upgrading was not the fix: 4.1.2 is already the newest stable release, and New
Architecture support is only in the 5.0 alpha line.
- The install is still arm64 only. That trim was previously applied by a code
path the New Architecture alone runs, so it is now written twice and no longer
depends on that setting.

**1.14.1** — The app opens and renders on its own.

- It had been built as a development client, which waits for a server on a
computer before showing anything — so an installed copy opened to a connection
prompt instead of the app. A development client in the project makes *every*
build one, however it is configured. Without it the app compiles its JavaScript
into itself and opens directly.

## 1.13 — production readiness

**1.13.1** — A saved setting could take the app down.

- The stored colour choice was used without being checked. A value the app does
not offer resolved to no palette at all, and because every screen reads a
colour, that crashed all of them. Each saved field is now validated before use,
and the tab that Search replaced is migrated rather than discarded.
- The API also stopped trusting a network proxy that may not be there — which
let a caller bypass the rate limit for free — and stopped answering
cross-origin requests by default in production.

## 1.12 — one design system, and screens that say what went wrong

**1.12.6** — Rebuilt the app on a single set of design tokens.

- Every screen, hook and store reads the current tokens. The previous token
  names were gone but still in use, which left 55 type errors and reads that
  returned `undefined`; a bad token is a crash at render, not a warning.
- Screens now live beside their feature (`home/`, `search/`, `podcasts/`,
  `saved/`, `discover/`) and the routes stay thin, so the name the router
  forces on a file no longer has to be the name the screen deserves.
- Every route is registered. expo-router turns any file in a Tabs directory
  into a tab, so two undeclared routes had been drawing two tabs that the
  design does not have.
- The Podcasts tab says why playback failed. Tapping play in the list used to
  do nothing visible; the reason was only shown inside the full player.
- Settings is a single screen again: its rows, sections and hook moved to the
  directories that describe them, and its values to the constants module.
- Components the new design replaced were removed rather than left behind.

**1.12.3** — The lead story no longer asserts a live status or a location. The
data carries neither, so both were invented.

**1.12.2** — The app's own visual language: a floating tab bar, a dark palette
built for reading, and an editorial feed of one lead story, three top stories,
topic sections and compact rows.

**1.12.1** — Restored podcast playback. A dependency swap had replaced the
native audio player with a browser-only library, which removed background audio
and broke the build.

## 1.11 — hardening

**1.11.3** — Every screen survives the states a first run hits: loading, empty,
offline and a failed refresh, each with a retry.

**1.11.2** — A stalled request now reports a timeout, distinct from the caller
cancelling it, and a timeout is never retried on the caller's behalf.

**1.11.1** — Fixed the in-memory cache fallback, which ignored the key prefix.
The same logical key could collide in-process while Redis was down.

## 1.10 — the brand

**1.10.3** — Two controls had shipped with icon names as their labels.

**1.10.2** — A welcome screen built around the slogan, *Keeping you updated.*

**1.10.1** — Applied the brand palette and separated `primary` from `accent` so
that text meets contrast on both light and dark backgrounds.

## 1.9 — an installable Android build

**1.9.5** — The native audio player loads lazily. It reads its own native module
while evaluating, so importing it directly took down the whole route table in a
build that has no player.

**1.9.3** — Allowed cleartext HTTP so a release build can reach the local API.

**1.9.2** — Set the release, named the creator and linked the EAS project.

## 1.7 — court judgments

**1.7.3** — SAFLII judgments ingest as their own topic and open as court
rulings, separate from the news feed.

## 1.5 — the app

**1.5.5** — Settings sections and the save bar.

**1.5.4** — The Home, Discover, Saved, Podcasts and Search screens.

**1.5.3** — Feed, podcast and player components.

**1.5.2** — The app foundation: routing, theme, state and the API client.

**1.5.1** — The shared API client and the release metadata both ends read.

## 1.4 — the API

**1.4.3** — The `/v1` routes and a health probe.

**1.4.2** — Cached read services for the feed, items, sources and search.

**1.4.1** — The application factory: security headers, CORS, compression,
request logging, rate limiting and one terminal error handler.

## 1.3 — ingestion

**1.3.4** — Podcast audio is captured from the feed enclosure, so episodes are
playable rather than just listed.

**1.3.3** — Ingestion is scheduled through pg-boss in Postgres.

**1.3.2** — Per-source and fan-out ingest jobs, so one refused feed does not
drop the others.

**1.3.1** — RSS and Atom feeds parse into normalised items: UTC dates, HTML
stripped to an excerpt, image and author extracted.

## 1.2 — cache

**1.2.1** — A Redis client over TCP that degrades to an in-process cache when
Redis is unavailable, so the API never hard-depends on it.

## 1.1 — the database

**1.1.4** — Seeded South African outlets and a curated set of crime and
true-life podcasts.

**1.1.3** — The `sources` and `content_items` schema, with a unique
`(source_id, external_id)` feed index and a full-text index.

**1.1.2** — The pooled database layer and its repositories.

**1.1.1** — Service environment is validated at startup and fails fast with a
readable message.

## 1.0.0 — scaffold

The workspace: a pnpm monorepo with an Expo app, an Express API, a pg-boss
worker, and shared database, cache and types packages.
