/**
 * Design tokens: colour, spacing, radius, typography and motion.
 *
 * Colours exist twice, as a light and a dark palette with the same keys. The
 * active one is chosen by `useTheme` from the `colourMode` setting and the OS
 * appearance. Nothing outside this file declares a colour.
 *
 * Two brand colours carry fixed roles and are not interchangeable:
 *
 * - `primary` is for actions — buttons, active tabs, switches, the player. It is
 *   used as a fill, with `onPrimary` text or icons on top of it.
 * - `accent` is for emphasis read directly against a surface — source lines,
 *   badges, the icon of an action that is currently on. It is used as ink.
 *
 * `onPrimary` and `onAccent` are the readable colours for each fill. Both
 * palettes are checked against WCAG AA; see docs/DESIGN.md.
 */

import type { ColourScheme, ColourTokens } from '@/types';

const semanticStates = {
  // Reserved meanings. Never reused as decorative accents.
  live: '#F04438',
  success: '#3FB950',
  warning: '#D29922',
  danger: '#F04438',
} as const;

export const palettes: Record<ColourScheme, ColourTokens> = {
  dark: {
    background: '#0B0B0B',
    surface: '#151515',
    // One step above `surface` and below `border`, so a raised card still reads
    // as raised without a shadow.
    surfaceRaised: '#1F1F1F',
    border: '#292929',
    borderStrong: '#3A3A3A',
    text: '#F5F5F5',
    textMuted: '#A3A3A3',
    // Lightened from the obvious #6E6E6E, which reads at only 3.6:1 on a card.
    textFaint: '#868686',
    primary: '#C34B00',
    onPrimary: '#FFFFFF',
    accent: '#E58A3A',
    onAccent: '#0B0B0B',
    ...semanticStates,
  },
  light: {
    background: '#FFFFFF',
    surface: '#F7F7F7',
    surfaceRaised: '#FFFFFF',
    border: '#E5E5E5',
    borderStrong: '#D4D4D4',
    text: '#141414',
    textMuted: '#5C5C5C',
    textFaint: '#6F6F6F',
    primary: '#C34B00',
    onPrimary: '#FFFFFF',
    // The brand orange darkened to carry as ink on white. The bright #E58A3A
    // manages only 2.6:1 there, which is not readable as text.
    accent: '#B45309',
    onAccent: '#FFFFFF',
    ...semanticStates,
  },
};

/** Radius scale: inputs 12, cards 16, sheets 24, pills 999. */
export const radius = {
  input: 12,
  card: 16,
  sheet: 24,
  pill: 999,
} as const;

export const spacingX = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const spacingY = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const typography = {
  size: {
    display: 34,
    heading: 28,
    title: 22,
    subtitle: 18,
    body: 16,
    small: 14,
    caption: 12,
  },
  leading: {
    tight: 1.15,
    snug: 1.3,
    relaxed: 1.6,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

/** Multipliers applied to body copy by the reader text-size setting. */
export const textScale = {
  small: 0.9,
  default: 1,
  large: 1.15,
} as const;

/** Motion tokens. Animations honour the OS reduced-motion setting. */
export const motion = {
  duration: {
    instant: 120,
    fast: 180,
    base: 240,
    slow: 360,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    decelerate: [0, 0, 0, 1],
    accelerate: [0.3, 0, 1, 1],
  },
} as const;

/** A radius step, e.g. `'card'`. */
export type RadiusToken = keyof typeof radius;

export default {
  palettes,
  radius,
  spacingX,
  spacingY,
  typography,
  motion,
  textScale,
};
