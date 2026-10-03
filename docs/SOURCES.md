# Sources

The worker polls a fixed list of sources. Each is a row in `sources` with a
`feed_url` the RSS adapter reads.

Feed URLs change and feeds stop working, so the exact URLs are verified against
each publisher during implementation and stored in a seed migration rather than
duplicated here. This document lists the intended starter set and the reason
each outlet is included.

## News outlets

| Outlet | Angle | Notes |
|---|---|---|
| GroundUp | Court, crime, social justice | Non-profit, free feed. Closest match to the product's focus |
| SAFLII | Court judgments | Source of `court_ruling` items; no general news reader carries this |
| Daily Maverick | Investigative, political | Free feed |
| Mail & Guardian | Investigative | Free feed |
| eNCA | Television news | Court and crime reporting |
| SABC News | Public broadcaster | Free feed |
| IOL | General national | Free feed |
| TimesLive / Sowetan | General national | Free feed |
| The Citizen | General | Marginal fit; include only if it adds court coverage |
| News24 | General national | Paywalled. Link out only; the feed is headline-level and body text is never ingested |

## Podcasts

Podcast shows are not hard-coded. Shows are discovered through Podcast Index,
and once a show is added, episodes are ingested from the show's own RSS feed
with the same adapter used for news.

Podcast Index requires a free API key and secret; see `.env.example`.

## Adapter behaviour

Feeds vary. The adapter must tolerate:

- Atom as well as RSS.
- Missing `pubDate`, missing GUID and missing author.
- Headline-only feeds that provide no excerpt.
- Publishers that reject unknown user agents.

A single failing feed must not fail the ingestion run. Each source is processed
independently and failures are recorded against that source.

## Content retention

Only metadata and excerpts are stored: title, link, timestamp, author, image and
summary. Full article text and audio are not copied. Items link out to the
publisher.
