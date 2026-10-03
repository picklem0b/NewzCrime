# Product

NewzCrime is a mobile reader for South African crime and court reporting. It
collects reporting from South African publications into a single chronological
feed and lets the reader follow stories through to the publisher. Podcasts are
the second content type, for listeners who want discussion rather than
reporting.

The differentiator is the focus: court proceedings and crime, including
judgments. A general news reader does not organise itself around that.

## First release scope

Two content types:

1. **News feed.** Articles aggregated from South African RSS feeds, filtered
   toward court, crime and justice, shown as headline, source, timestamp and
   excerpt. Selecting an item opens the publisher's page.
2. **Podcasts.** Shows are discovered through Podcast Index; episodes are
   ingested from each show's own RSS feed and played with background audio and
   lock-screen controls.

Everything else — YouTube video, live streams, audiobooks and newsletters — is
deferred. See [`ROADMAP.md`](ROADMAP.md) for what each would cost.

## Screens

| Screen | Purpose |
|---|---|
| `auth/Welcome` | First screen; leads to sign in or registration |
| `auth/LoginSheet` | Sign in |
| `auth/RegisterSheet` | Registration |
| `tabs/Home` | The court and crime feed |
| `tabs/Discover` | Podcast shows and outlets to follow |
| `tabs/Saved` | Bookmarked articles and episodes |
| `tabs/Settings` | Preferences |
| `search/Search` | Search over stored articles and episodes |
| `detail/ItemDetail` | An article, judgment or episode |
| `detail/SourceDetail` | One outlet or one show |
| `player/Player` | Audio playback |

## Definition of done

The first release is complete when a reader can open the app, read a court or
crime story from a South African outlet, find a podcast and listen to an
episode with the screen off.

## Content rules

These are constraints on the product, not implementation details.

1. **Do not re-host third-party content.** Metadata and excerpts are stored;
   full article text, podcast audio and video are not. Items link out to the
   publisher.
2. **Use the embedded player for video.** Where a platform's terms require it,
   playback stays inside the provider's player rather than a direct stream.
3. **Respect provider data-retention limits.** Data obtained from a third-party
   API may be cached only for the period that API's policy allows, and must be
   refreshed afterwards.
4. **Attribute every claim.** Court reporting carries defamation risk:
   allegations before a ruling, commission testimony and named individuals. The
   app attributes statements to their source and does not editorialise.
5. **API quotas are shared, not per user.** A single API key serves every user,
   so any request a user can trigger repeatedly must be cached or avoided.
