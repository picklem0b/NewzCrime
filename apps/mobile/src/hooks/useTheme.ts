import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import {
	accentPalettes,
	contrastTweaks,
	densitySpacing,
	elevation,
	layout,
	motion,
	palettes,
	radius,
	spacing
} from '@/constants/theme';
import type { ColourScheme } from '@/types';

import { useSetting } from './useSettings';

/**
 * The active palette, resolved from the appearance settings and the OS.
 *
 * Accent colour and high contrast are merged over the base palette here rather
 * than read by each component, so every screen changes together.
 */
export function useTheme() {
	const mode = useSetting('colourMode');
	const accentColour = useSetting('accentColour');
	const highContrast = useSetting('highContrast');
	const density = useSetting('density');
	const systemScheme = useColorScheme();

	const scheme: ColourScheme =
		mode === 'system'
			? systemScheme === 'light'
				? 'light'
				: 'dark'
			: mode;

	const colour = useMemo(
		() => ({
			...palettes[scheme],
			...accentPalettes[accentColour][scheme],
			...(highContrast ? contrastTweaks[scheme] : {})
		}),
		[scheme, accentColour, highContrast]
	);

	return {
		colour,
		scheme,
		radius,
		spacing,
		layout,
		motion,
		elevation,
		rowSpacing: densitySpacing[density],
		density,
		accentColour
	};
}
