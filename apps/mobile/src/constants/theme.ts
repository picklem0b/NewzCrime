/**
 * Design tokens: colour, spacing, radius, typography and motion.
 *
 * The palette is a placeholder until colours are chosen. Every colour lives in
 * the `colour` object below; nothing outside this file hard-codes a colour.
 */

export const colour = {
  // Placeholder palette.
  background: '#0B0B0D',
  surface: '#131316',
  surfaceRaised: '#1B1B20',
  border: '#26262C',
  borderStrong: '#3A3A42',

  text: '#F4F4F5',
  textMuted: '#A1A1AA',
  textFaint: '#6B6B76',

  // One accent, used app-wide.
  accent: '#E9A23B',
  onAccent: '#0B0B0D',

  // Reserved semantic states; never decorative.
  live: '#F04438',
  success: '#3FB950',
  warning: '#D29922',
  danger: '#F04438',
} as const;

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
    tight: 1.1,
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

export const theme = { colour, radius, spacingX, spacingY, typography, motion };

/** A reserved colour name, e.g. `'accent'`. */
export type ColourToken = keyof typeof colour;
/** A radius step, e.g. `'card'`. */
export type RadiusToken = keyof typeof radius;
/** The full design-token object passed through context. */
export type Theme = typeof theme;

export default theme;
