import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

import type {
	ColourScheme,
	ColourTokens,
	TextVariant,
	TextVariantSpec
} from '@/types';

export const palettes: Record<ColourScheme, ColourTokens> = {
	dark: {
		background: '#0B0B0B',
		surface: '#151515',
		surfaceRaised: '#1F1F1F',
		skeleton: '#232323',
		border: '#292929',
		borderStrong: '#3A3A3A',
		pressed: 'rgba(255,255,255,0.06)',
		text: '#F5F5F5',
		textMuted: '#A3A3A3',
		textFaint: '#868686',
		primary: '#C34B00',
		onPrimary: '#FFFFFF',
		accent: '#E58A3A',
		onAccent: '#0B0B0B',
		accentSoft: 'rgba(229,138,58,0.16)',
		scrim: 'rgba(0,0,0,0.55)',
		info: '#6CB6FF',
		success: '#3FB950',
		warning: '#D29922',
		danger: '#F97066',
		live: '#F97066'
	},
	light: {
		background: '#FFFFFF',
		surface: '#F7F7F7',
		surfaceRaised: '#FFFFFF',
		skeleton: '#EBEBEB',
		border: '#E5E5E5',
		borderStrong: '#C9C9C9',
		pressed: 'rgba(0,0,0,0.05)',
		text: '#141414',
		textMuted: '#5C5C5C',
		textFaint: '#6F6F6F',
		primary: '#C34B00',
		onPrimary: '#FFFFFF',
		accent: '#B45309',
		onAccent: '#FFFFFF',
		accentSoft: 'rgba(180,83,9,0.10)',
		scrim: 'rgba(0,0,0,0.45)',
		info: '#0B5CAD',
		success: '#1A7F37',
		warning: '#8A5A00',
		danger: '#B42318',
		live: '#B42318'
	}
};

export const radius = {
	sm: 4,
	md: 8,
	lg: 12,
	xl: 20,
	pill: 999
} as const;

export const spacing = {
	xxs: 2,
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48
} as const;

export const layout = {
	touch: 44,
	gutter: 16,
	gutterWide: 24,
	wideBreakpoint: 640,
	readingMax: 680,
	contentMax: 960,
	tabBarHeight: 56,
	rowThumb: { width: 96, height: 72 },
	heroAspect: 16 / 9
} as const;

export const fontFamily = {
	serif: Platform.select<string>({
		ios: 'Georgia',
		android: 'serif',
		default: 'Georgia, "Times New Roman", serif'
	}),
	sans: undefined as string | undefined
} as const;

const serifBold = {
	fontFamily: fontFamily.serif,
	fontWeight: '700' as const
};

export const textVariants: Record<TextVariant, TextVariantSpec> = {
	masthead: {
		...serifBold,
		fontSize: 26,
		lineHeight: 30,
		letterSpacing: -0.4,
		scalable: false
	},
	display: {
		...serifBold,
		fontSize: 32,
		lineHeight: 38,
		letterSpacing: -0.4,
		scalable: true
	},
	h1: {
		...serifBold,
		fontSize: 28,
		lineHeight: 34,
		letterSpacing: -0.3,
		scalable: true
	},
	h2: {
		...serifBold,
		fontSize: 24,
		lineHeight: 30,
		letterSpacing: -0.2,
		scalable: true
	},
	h3: {
		...serifBold,
		fontSize: 18,
		lineHeight: 24,
		letterSpacing: -0.1,
		scalable: true
	},
	h4: {
		...serifBold,
		fontSize: 16,
		lineHeight: 22,
		scalable: true
	},
	standfirst: {
		fontFamily: fontFamily.serif,
		fontWeight: '400',
		fontSize: 18,
		lineHeight: 28,
		scalable: true
	},
	body: {
		fontWeight: '400',
		fontSize: 16,
		lineHeight: 24,
		scalable: true
	},
	small: {
		fontWeight: '400',
		fontSize: 14,
		lineHeight: 20,
		scalable: true
	},
	label: {
		fontWeight: '700',
		fontSize: 12,
		lineHeight: 16,
		letterSpacing: 0.6,
		textTransform: 'uppercase',
		scalable: false
	},
	meta: {
		fontWeight: '400',
		fontSize: 12,
		lineHeight: 16,
		scalable: false
	},
	button: {
		fontWeight: '600',
		fontSize: 16,
		lineHeight: 20,
		scalable: false
	}
};

export const textScale = {
	small: 0.9,
	default: 1,
	large: 1.15
} as const;

export const maxFontSizeMultiplier = 1.4;

export const motion = {
	duration: {
		instant: 100,
		fast: 160,
		base: 220,
		pulse: 1100
	}
} as const;

export const elevation: Record<'floating', ViewStyle> = {
	floating: {
		shadowColor: '#000000',
		shadowOpacity: 0.16,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: -2 },
		elevation: 6
	}
};

export const brand = {
	name: 'NewzCrime',
	slogan: 'Keeping you updated.',
	region: 'en-ZA',
	timeZone: 'Africa/Johannesburg'
} as const;

export type RadiusToken = keyof typeof radius;
export type SpacingToken = keyof typeof spacing;

export default {
	palettes,
	radius,
	spacing,
	layout,
	textVariants,
	motion,
	textScale,
	elevation,
	brand
};
