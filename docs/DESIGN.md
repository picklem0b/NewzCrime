# Design

The app is a reading product first. Headlines, source names and timestamps are
the content, so they carry the design; chrome stays out of the way.

## Colour

Two palettes, one light and one dark, with identical keys in
`apps/mobile/src/constants/theme.ts`. `useTheme` picks one from the `colourMode`
setting, falling back to the OS appearance when the setting is `system`. No
other file declares a colour, so replacing the two `palettes` entries replaces
the whole visual system.

Two rules apply to both:

- **One accent colour**, used app-wide for interactive emphasis.
- **Semantic states are reserved.** Live, success, warning and danger have fixed
  meanings and are never reused as decorative accents. Live is reserved for the
  live-stream feature, which is not in this release, and is currently unused.

## Typography

A single sans display face is used throughout. Serif is reserved for editorial
pull-quotes and is never the default. Display leading is never `1.0`.

Size, leading and weight scales are in `theme.ts`. Body copy is multiplied by
`textScale` from the reader text-size setting, so headlines and excerpts render
at three sizes without changing the layout.

## Layout

- One radius scale: inputs `12`, cards `16`, sheets `24`, pills `999`.
- Cards are used where a boundary earns it — story cards and show cards. Lists
  use separators instead.
- Safe areas, the status bar, the tab bar and the home-indicator region are
  respected on every screen. The player bar sits above the tab bar and renders
  nothing while no episode is loaded.

## States

Every list defines four states: loading, empty, error and content. Loading uses
skeletons that match the final layout's shape. Empty states are composed, not
blank. Errors appear inline with a retry, never as a toast.

## Motion

- Frequent interactions — tab switches, list taps — are instant or have no
  animation at all.
- Only rare transitions may be expressive.
- Every animation degrades to an immediate state change when the operating
  system's reduced-motion setting is enabled.

## Iconography

One icon family (Phosphor), one weight per context, the `*Icon` exports, and no
hand-drawn SVG paths. Icons are added through `react-native-svg`.

## Artwork brief

No artwork exists yet. This brief describes what is required and where each
asset is used; assets are placed in `apps/mobile/assets/`.

| Asset | Used by | Notes |
|---|---|---|
| `splash.png` | `src/app/index.tsx` | Mark on the background colour, centred, generous margin |
| `welcomeHero.png` | `src/app/auth/Welcome.tsx` | The one hero image. Bottom-to-top fade so the headline sits on a clean area |
| `authBackdrop.png` | `LoginSheet`, `RegisterSheet` | Low contrast; must not compete with form fields |
| `appIcon.png` | `app.json` | Square; readable at 1024px and at 48px |
| `adaptiveIcon.png` | Android | Foreground layer, safe zone respected |
| `emptyState.png` | Saved and Search empty states | Calm, not a cartoon |
| `showFallback.png` | Podcast show with no artwork | On-palette; podcast feeds frequently omit an image |
| `showPlaceholder.png` | Episode row artwork fallback | 300 × 300 source |

Rules:

- **Readability first.** Any image behind text needs a fade, mask or scrim.
- **One visual language.** The same palette, texture strength and framing across
  every asset.
- **Texture, not noise.** Subtle grain or gradient depth is fine; heavy texture
  that competes with the UI is not.
- **No stock-photo filler.**
- Both palettes must be considered: artwork that only works on a dark background
  is not finished.

Suggested sizes: hero images 1170 × 2532 (portrait), icons 1024 × 1024,
empty-state art 600 × 600 transparent PNG.
