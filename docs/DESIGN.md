# Design

The app is a reading product first. The visual system is a dark editorial
layout built for trust, readability and information density: headlines, source
names and timestamps are the content, so they carry the design.

## Colour

The palette is not final. `apps/mobile/src/constants/theme.ts` ships a neutral
placeholder palette so screens can be built before the colours are chosen.
Every colour lives in the single `colour` object in that file; no other file
hard-codes a colour. Replacing that object replaces the palette.

Two rules apply regardless of the palette:

- **One accent colour**, used app-wide for interactive emphasis.
- **Semantic states are reserved.** Live, success, warning and danger have fixed
  meanings and are never reused as decorative accents. Live is reserved for the
  live-stream feature, which is not in the first release, and is currently
  unused.

## Typography

A single sans display face is used throughout. Serif is reserved for editorial
pull-quotes and is never the default. Display leading is never `1.0`.

Size, leading and weight scales are in `theme.ts`. Screen text size is a user
setting, so body copy must render at three sizes without breaking layout.

## Layout

- One radius scale: inputs `12`, cards `16`, sheets `24`, pills `999`.
- Cards are used only where elevation communicates something. Otherwise use
  borders or spacing.
- Safe areas, the status bar, the tab bar and the home-indicator region are
  respected on every screen.
- The first screen is calm: one focal point, a short headline, one action.

## States

Every list and screen defines four states: loading, empty, error and content.
Loading uses skeletons that match the final layout's shape. Empty states are
composed, not blank. Errors appear inline rather than as a toast.

## Motion

- Frequent interactions — tab switches, list taps — are instant or have no
  animation at all.
- Only rare transitions may be expressive.
- Every animation degrades to an immediate state change when the operating
  system's reduced-motion setting is enabled.

## Iconography

One icon family (Phosphor), one stroke width, no hand-drawn SVG paths.

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
- Colours follow the palette once it is finalised.

Suggested sizes: hero images 1170 × 2532 (portrait), icons 1024 × 1024,
empty-state art 600 × 600 transparent PNG.
