# Design

The app is a reading product first. Headlines, source names and timestamps are
the content, so they carry the design; chrome stays out of the way.

## Colour

Two palettes, one light and one dark, with identical keys in
`apps/mobile/src/constants/theme.ts`. `useTheme` picks one from the `colourMode`
setting, falling back to the OS appearance when the setting is `system`. No
other file declares a colour, so replacing the two `palettes` entries replaces
the whole visual system.

### The brand values

These are the brand owner's and are used exactly as given, in both palettes
unless a palette is listed separately:

| Token | Dark | Light | Role |
|---|---|---|---|
| `primary` | `#C34B00` | `#C34B00` | Actions: buttons, active tab, switches, the player |
| `accent` | `#E58A3A` | `#B45309` | Emphasis read against a surface: source lines, badges, active icons |
| `background` | `#0B0B0B` | `#FFFFFF` | The page |
| `surface` | `#151515` | `#F7F7F7` | Cards and rows |
| `text` | `#F5F5F5` | `#141414` | Body and headlines |
| `textMuted` | `#A3A3A3` | `#5C5C5C` | Secondary text |
| `border` | `#292929` | `#E5E5E5` | Hairline dividers and outlines |

### The two brand colours are not interchangeable

- **`primary` is a fill.** It goes behind `onPrimary` text or icons — buttons,
  the active tab, a switch track, the player. Used as a fill it is unambiguous.
- **`accent` is ink.** It is read directly against a surface — the source line
  on a story card, a badge, the icon of an action that is currently on.

The rule for choosing: a selection among peers is a *highlight*, so a selected
`TopicChips` pill and the segmented control in `SettingRow` use `accent`. A
control that simply acts — a button, the tab bar, a switch — uses `primary`.

`accent` is the one brand value that differs between palettes, for a reason: the
brand orange `#E58A3A` reads at only 2.6:1 on white, so the light palette
darkens it to `#B45309` (5.0:1).

### Derived tokens

`surfaceRaised`, `borderStrong`, `textFaint`, `onPrimary` and `onAccent` are not
brand values. They are steps derived to keep each palette internally consistent.
`textFaint` is the one to watch, because it carries bylines, timestamps and
inactive tabs: it is set to clear 4.5:1 on `surface` rather than to look as pale
as possible. `#6E6E6E` looked right and measured 3.6:1, which is why it is
`#868686`.

### Contrast

Every text pair is measured against WCAG AA — 4.5:1 for body text, 3:1 for UI
components. Measured values:

| Pair | Dark | Light |
|---|---|---|
| `text` on `background` | 18.05:1 | 18.42:1 |
| `text` on `surface` | 16.75:1 | 17.20:1 |
| `textMuted` on `surface` | 7.24:1 | 6.24:1 |
| `textFaint` on `surface` | 5.02:1 | 4.69:1 |
| `accent` on `background` | 7.52:1 | 5.02:1 |
| `onPrimary` on `primary` | 4.85:1 | 4.85:1 |
| `onAccent` on `accent` | 7.52:1 | 5.02:1 |
| `primary` as ink on `background` | **4.06:1** | 4.85:1 |

The last row is the one open item. `primary` clears 3:1 on the dark background,
so it is legible as an icon, but the active tab tint also colours an 11px label,
which is body text and wants 4.5:1. Two ways out, both cheap: use `accent`
(7.52:1) for the tab tint, or give `primary` a lighter dark-mode-only variant.

### Reserved meanings

Live, success, warning and danger have fixed meanings and are never reused as
decorative accents. Live is reserved for the live-stream feature, which is not in
this release, and is currently unused.

## Copy

The slogan is **Keeping you updated.** — spelled exactly that way, with the full
stop. It is the brand line and appears under the wordmark on the Welcome screen;
it is held in one place (`apps/mobile/src/app/auth/Welcome.tsx`) so the app never
spells it two ways.

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
- The tab bar floats over the content instead of reserving space beside it, so
  every list that scrolls beneath it pads its content by `tabBar.clearance`.
  That token is derived from the bar's own `height` and `offset`, so the bar and
  the lists cannot drift apart; without the padding the last row sits under the
  bar and cannot be tapped.

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
