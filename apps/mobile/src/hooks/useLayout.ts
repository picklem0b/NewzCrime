import { useWindowDimensions } from 'react-native';

import { layout } from '@/constants/theme';

export interface LayoutMetrics {
	width: number;
	isWide: boolean;
	gutter: number;
	contentWidth: number;
}

export function useLayout(): LayoutMetrics {
	const { width } = useWindowDimensions();
	const isWide = width >= layout.wideBreakpoint;
	const gutter = isWide ? layout.gutterWide : layout.gutter;
	const contentWidth = Math.min(width, layout.contentMax);

	return { width, isWide, gutter, contentWidth };
}
