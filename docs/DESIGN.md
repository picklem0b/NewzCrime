# Design

NewzCrime is a reading product for South African crime and court news. Headlines,
sources and times are the content, so type and spacing carry the design and
chrome stays quiet. Research and audit: [`design/RESEARCH.md`](design/RESEARCH.md),
[`design/AUDIT.md`](design/AUDIT.md).

All tokens live in `apps/mobile/src/constants/theme.ts`. No other file declares a
colour, size, radius or spacing value.

## Colour

Semantic tokens in two palettes: `background`, `surface`, `surfaceRaised`,
`skeleton`, `border`, `borderStrong`, `pressed`, `text`, `textMuted`,
`textFaint`, `primary`, `onPrimary`, `accent`, `onAccent`, `accentSoft`, `scrim`,
`info`, `success`, `warning`, `danger`, `live`.

`primary` (`#C34B00`) fills buttons only; white on it is 4.85:1. As text on the
dark background it is 4.06:1, so text and selection use `accent`.

| Pair | Dark | Light |
|---|---|---|
| `text` on `background` | 18.1:1 | 18.4:1 |
| `textMuted` on `background` | 7.8:1 | 6.7:1 |
| `textFaint` on `background` | 5.4:1 | 5.0:1 |
| `accent` on `background` | 7.5:1 | 5.0:1 |
| `onPrimary` on `primary` | 4.85:1 | 4.85:1 |

`live` is reserved for a live-stream feature that does not exist and is unused.
The word "Breaking" is not shown anywhere because the data has no such flag.

## Typography

Serif for headlines and summaries (Georgia on iOS, the system serif on Android),
system sans for interface text and metadata. Roles in `textVariants`:

| Variant | Use | Size / line |
|---|---|---|
| `masthead` | Wordmark | 26 / 30 |
| `display` | Lead and article headline on wide screens | 32 / 38 |
| `h1` | Article headline, screen titles | 28 / 34 |
| `h2` | Lead story on phones | 24 / 30 |
| `h3` | Story row headline, section titles in settings | 18 / 24 |
| `h4` | Compact headline | 16 / 22 |
| `standfirst` | Article summary | 18 / 28 |
| `body` | Interface and excerpts | 16 / 24 |
| `small` | Secondary text | 14 / 20 |
| `label` | Kicker, section header (uppercase) | 12 / 16 |
| `meta` | Source and time | 12 / 16 |
| `button` | Buttons | 16 / 20 |

Headline, body and small variants scale with the reader text-size setting;
labels, metadata and buttons do not. Text stops growing at 1.4 times.

## Spacing, radius, elevation, motion

- Spacing: `xxs 2, xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48`. Gutter 16, 24 from 640 wide.
- Radius: `sm 4` badges, `md 8` images and thumbnails, `lg 12` buttons, inputs and grouped lists, `xl 20` reserved for sheets, `pill` chips.
- Elevation: one shadow, on the mini player. Everything else separates with hairlines or surface steps.
- Motion: press feedback and the loading pulse only. The pulse stops when the system asks for reduced motion.

## Components

`ui/` Text, Button (primary, secondary, quiet), IconButton, Chip, Badge,
SectionHeader, SearchField, Skeleton, Thumb, Column.
`feed/` LeadStory, StoryRow (standard and compact), StoryKicker, StoryMeta,
SaveButton, TopicBar. `podcast/` EpisodeRow, ShowTile. `source/` SourceRow.
`feedback/` EmptyState, ErrorState (offline, timeout, server), ListSkeleton.
`layout/` Screen, TabScreen, ScreenHeader. `player/` MiniPlayer.

There is no Toast, Sheet or Modal because no flow needs one: saving is shown on
the control itself and errors appear inline with a retry.

## Information architecture

Four tabs: **Today**, **Search**, **Podcasts**, **Library**. Settings is
reached from the Library header. Article, source and player screens are pushed
on top of the tabs and keep the mini player.

Two further routes — **Discover** (browse every outlet and show) and
**Settings** — are registered in `tabs/_layout.tsx` with `href: null`. They are
reachable by navigation but deliberately hold no tab, so the set of tabs stays
the four above. expo-router registers any file in a Tabs directory as a tab, so
leaving them undeclared would have drawn six.

Today builds its hierarchy in `feed/layout.ts`: one lead story (the first of the
newest five with an image), three top stories, topic sections only when a topic
has two or more stories, then the remainder as compact rows. Filtered topics
show a flat list.

## Article page

Headline, kicker (topic, Judgment or Episode), byline, publication date and
time in South African time, hero image, publisher summary, a primary button to
the full story on the publisher's site, save, share and listen. Body text is
never reproduced (see `PRODUCT.md`).

## Responsive

Content is centred with a 960 maximum width and a 680 reading column on
articles. From 640 wide the lead story places image and text side by side.
Touch targets are 44 or larger; chips are 36 with a 4 point hit slop.

## States

Every list has loading, empty, error and content. Loading uses skeletons shaped
like the final layout. Errors say whether the device is offline and offer a retry.
A failed refresh keeps the stories on screen and shows a retry notice.

## Copy

The slogan is **Keeping you updated.**, held in `brand.slogan` and shown in
Settings. Never spelled another way.

## Iconography

Phosphor, `*Icon` exports, regular when inactive and fill when active.

## Artwork

`welcomeHero.png` and `authBackdrop.png` were used by screens that no longer
exist. `splash.png`, `appIcon.png` and `adaptiveIcon.png` are still required;
see `app.json`. Artwork rules: readability first, one visual language, no
stock filler, both palettes considered.
