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
