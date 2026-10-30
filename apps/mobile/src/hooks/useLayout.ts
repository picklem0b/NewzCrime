import { useWindowDimensions } from 'react-native';

import { layout } from '@/constants/theme';

import { useSetting } from './useSettings';

export interface LayoutMetrics {
	width: number;
	isWide: boolean;
	gutter: number;
	contentWidth: number;
	/** Minimum interactive size; grows when larger touch targets are on. */
	touch: number;
}

export function useLayout(): LayoutMetrics {
	const { width } = useWindowDimensions();
	const largeTargets = useSetting('largeTouchTargets');
	const isWide = width >= layout.wideBreakpoint;
	const gutter = isWide ? layout.gutterWide : layout.gutter;
	const contentWidth = Math.min(width, layout.contentMax);
	const touch = layout.touch + (largeTargets ? 8 : 0);

	return { width, isWide, gutter, contentWidth, touch };
}
