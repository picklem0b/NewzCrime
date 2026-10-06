import type { ColourScheme, ColourTokens } from '@/types';
const semanticStates = {
	live: '#D92D20',
	success: '#238636',
	warning: '#B54708',
	danger: '#D92D20'
} as const;
export const palettes: Record<ColourScheme, ColourTokens> = {
	dark: {
		background: '#0E1012',
		surface: '#171A1D',
		surfaceRaised: '#20252A',
		border: '#2A3036',
		borderStrong: '#3B444D',
		text: '#F4F6F8',
		textMuted: '#B0B9C2',
		textFaint: '#8D98A3',
		primary: '#C34B00',
		onPrimary: '#FFFFFF',
		accent: '#F0A15D',
		onAccent: '#101214',
		...semanticStates
	},
	light: {
		background: '#FAFAF8',
		surface: '#F1F2F0',
		surfaceRaised: '#FFFFFF',
		border: '#D9DDDA',
		borderStrong: '#B8BFBA',
		text: '#17201B',
		textMuted: '#56615A',
		textFaint: '#68746C',
		primary: '#C34B00',
		onPrimary: '#FFFFFF',
		accent: '#9A3E08',
		onAccent: '#FFFFFF',
		...semanticStates
	}
};
export const radius = { input: 12, card: 16, sheet: 24, pill: 999 } as const;
export const spacingX = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48
} as const;
export const spacingY = spacingX;
/**
 * Floating tab bar geometry. The bar is drawn over the screen rather than beside
 * it, so a list that scrolls beneath it must pad its content by `clearance` or
 * its last row ends up underneath the bar and cannot be tapped.
 */
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_OFFSET = 10;
export const tabBar = {
	height: TAB_BAR_HEIGHT,
	offset: TAB_BAR_OFFSET,
	clearance: TAB_BAR_HEIGHT + TAB_BAR_OFFSET + spacingY.lg
} as const;
/**
 * Colours for content drawn over imagery.
 *
 * Deliberately outside `palettes`: what sits underneath is a photograph behind a
 * dark scrim, so the contrast is the same in light and dark mode and the two
 * schemes must not pretend otherwise.
 */
export const onImage = {
	/** Bottom scrim for a hero that carries copy on top of it. */
	scrim: ['rgba(10,12,14,0.05)', 'rgba(10,12,14,0.88)'],
	text: '#FFFFFF',
	textMuted: 'rgba(255,255,255,0.78)',
	textFaint: 'rgba(255,255,255,0.75)',
	/** Lightened: the bright brand orange is unreadable over a photograph. */
	kicker: '#FFB28B',
	/** Translucent fill and outline for a control sitting on imagery. */
	control: 'rgba(255,255,255,0.2)',
	controlBorder: 'rgba(255,255,255,0.25)'
} as const;
/** Elevation shadows are black in both schemes; opacity carries the weight. */
export const shadowColour = '#000';
export const typography = {
	size: {
		display: 36,
		heading: 28,
		title: 22,
		subtitle: 18,
		body: 16,
		small: 14,
		caption: 12
	},
	leading: { tight: 1.15, snug: 1.32, relaxed: 1.62 },
	weight: { regular: '400', medium: '500', semibold: '600', bold: '700' }
} as const;
export const textScale = { small: 0.9, default: 1, large: 1.15 } as const;
export const motion = {
	duration: { instant: 120, fast: 180, base: 240, slow: 360 },
	easing: {
		standard: [0.2, 0, 0, 1],
		decelerate: [0, 0, 0, 1],
		accelerate: [0.3, 0, 1, 1]
	}
} as const;
export type RadiusToken = keyof typeof radius;
export default {
	palettes,
	onImage,
	radius,
	spacingX,
	spacingY,
	shadowColour,
	tabBar,
	typography,
	motion,
	textScale
};
