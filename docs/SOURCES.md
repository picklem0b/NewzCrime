# Sources

The starter set is seeded by migration `1730000000002_seedSources`. Each row is
a `sources` record with a `feed_url` the RSS adapter reads. Re-running the seed
is safe: it inserts on `feed_url` and skips anything already present.

Feed URLs change and feeds stop working, so verify a URL before adding it, and
set `is_active` to false rather than deleting a source that has stopped
responding — its items stay readable.

## News outlets

| Outlet | Feed | Status |
|---|---|---|
| GroundUp | `https://www.groundup.org.za/sitenews/rss/` | Active |
| Mail & Guardian | `https://mg.co.za/rss` | Active |
| IOL | `https://www.iol.co.za/rss` | Active |
| SABC News | `https://www.sabcnews.com/sabcnews/feed/` | Active |
| The Citizen | `https://www.citizen.co.za/feed/` | Active |
| eNCA | `https://www.enca.com/rss.xml` | Active |
| TimesLIVE | `https://www.timeslive.co.za/arc/outboundfeeds/rss/` | Active |
| SowetanLIVE | `https://www.sowetanlive.co.za/arc/outboundfeeds/rss/` | Active |
| BusinessLIVE | `https://www.businesslive.co.za/arc/outboundfeeds/rss/` | Active |
| The South African | `https://www.thesouthafrican.com/feed/` | Active |
| Daily Maverick | `https://www.dailymaverick.co.za/feed/` | Inactive — returns 403 to this host |
| News24 | `https://feeds.24.com/articles/news24/topstories/rss` | Inactive — host does not resolve here |

GroundUp is the closest match to the product's focus: courts, crime and social
justice, from a non-profit publisher.

News24 is paywalled. Its feed is headline-level, and body text is never
ingested.

## Podcast shows

Shows are curated in the seed rather than discovered at runtime. Episode audio
comes from each show's own feed, through the same adapter used for news.

| Show | Feed |
|---|---|
| True Crime South Africa | `https://rss.iono.fm/rss/chan/4652` |
| Murder and Mayhem: South African True Crime | `https://feed.podbean.com/murderandmayhemsouthafricantruecrime/feed.xml` |
| Unsolved Murders South Africa | `https://anchor.fm/s/1076e208c/podcast/rss` |
| True Crime and Scams in South Africa | `https://rss.buzzsprout.com/2651897.rss` |
| Crime Central South Africa | `https://anchor.fm/s/e8019828/podcast/rss` |
| True Crime Chronicles: South Africa | `https://anchor.fm/s/150b1a0c/podcast/rss` |

Podcast Index discovery is implemented but requires a free API key and secret;
see `.env.example`. With no credentials, discovery is skipped and the seeded
shows still ingest.

## Adapter behaviour

Feeds vary. The adapter tolerates:

- Atom as well as RSS.
- Missing `pubDate`, missing GUID and missing author.
- Headline-only feeds that provide no excerpt.
- Publishers that reject unknown user agents.
- Feeds whose entity usage exceeds the parser's default budget.

A single failing feed never fails the ingestion run. Each source is processed
independently, and the failure is recorded against that source.

## Content retention

Only metadata and excerpts are stored: title, link, timestamp, author, image,
summary and the audio enclosure URL. Full article text and audio files are not
copied. Items link out to the publisher.
