# NewzCrime UI audit (before v1.9.1)

Baseline: `tsc` clean, 68 unit tests passing. The app is React Native with
Expo Router, not a web app, so "desktop" here means tablet and landscape.

## Architecture

Expo Router, five tabs (Home, Discover, Saved, Podcasts, Settings) plus Search,
ItemDetail, SourceDetail and Player. Zustand stores for settings, saved items
and player. Data through `contentService` against the `/v1` API. Content rules
in `PRODUCT.md` apply: summaries and links only, never republished article text.

## Broken or misleading functionality

| Finding | Evidence |
|---|---|
| Four settings do nothing | `breakingNews`, `podcastNotifications`, `downloadOnWifi`, `autoplayNext` were stored and never read; there is no notification or download code |
| Pull-to-refresh emptied the feed | `useFeed.refresh` cleared the items before fetching, so refresh replaced content with a skeleton |
| Stale pages could append to the wrong topic | `loadMore` had no generation guard |
| Wrong attribution | Rows fell back to the label "NewzCrime" until sources loaded, crediting the publisher's story to the app |
| Every screen fetched `/v1/sources` separately | `useSourceIndex` owned its own request |
| Selected podcast show had no visual state | Tapping a show changed the list with no indication which show was active |
| Search stopped at the first page | No pagination, no recents, no filters |
| Settings changes needed an explicit Save | Theme changes previewed but did not persist until a bar was pressed |
| Mini player disappeared on detail screens | Only tab screens rendered it |
| Dead screens | `Welcome`, `LoginSheet`, `RegisterSheet` were unrouted; the sheets rendered nothing |
| Court judgments looked like news | `court_ruling` items had no visual distinction |
| Offline looked like a server fault | Raw error strings, no offline wording |

## UX and visual problems

- Every story the same bordered card with three action buttons; no hierarchy.
- Lead story had no hero treatment; topic was never shown.
- Three entry points to search (Home icon, Discover bar, Search route) and outlets repeated as show cards.
- Settings occupied a tab despite being rarely used.
- Section titles were 28px bold on every screen; no editorial type.
- Duplicated spacing scales (`spacingX`, `spacingY`) with identical values.

## Accessibility

- Tab tint `#C34B00` on `#0B0B0B` is 4.06:1, below 4.5:1 for text.
- Touch targets: card actions about 26px, chips about 37px, mini player controls about 36px, player skip buttons about 34px.
- Search input and some icon buttons had no accessible label.
- Tab labels at 11px; inactive tabs distinguished by colour only.
- Progress bar not operable by assistive technology.

## Responsive

Single column everywhere with no maximum width, so tablets stretched headlines
across the screen. Bottom safe area ignored on pushed screens.

## Reusable as is

Services, stores (saved, settings, speech, player), `playbackService`, API
contracts, ErrorBoundary, the Phosphor icon set, `expo-image`, FlashList.
