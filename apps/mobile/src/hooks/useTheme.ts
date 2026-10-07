import { useColorScheme } from 'react-native';

import {
	elevation,
	layout,
	motion,
	palettes,
	radius,
	spacing
} from '@/constants/theme';
import type { ColourScheme } from '@/types';

import { useSetting } from './useSettings';

export function useTheme() {
	const mode = useSetting('colourMode');
	const systemScheme = useColorScheme();

	const scheme: ColourScheme =
		mode === 'system'
			? systemScheme === 'light'
				? 'light'
				: 'dark'
			: mode;

	return {
		colour: palettes[scheme],
		scheme,
		radius,
		spacing,
		layout,
		motion,
		elevation
	};
}
