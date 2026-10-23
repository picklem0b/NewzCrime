/**
 * Typography for long-form copy, resolved from the Reading settings.
 *
 * Kept separate from `useTheme` because only the article and player bodies use
 * it: applying justified text or tighter leading to settings rows would be a
 * readability regression, not a preference.
 */

import { readerLineHeight } from '@/constants/theme';
import type { LineHeight, TextAlign } from '@/types';

import { useSetting } from './useSettings';

export interface ReaderType {
	/** Multiplier for the standfirst and body leading. */
	lineHeight: number;
	textAlign: TextAlign;
	/** True when the reading progress bar should be shown. */
	showProgress: boolean;
	keepAwake: boolean;
}

export function useReaderType(): ReaderType {
	const lineHeightChoice: LineHeight = useSetting('lineHeight');

	return {
		lineHeight: readerLineHeight[lineHeightChoice],
		textAlign: useSetting('textAlign'),
		showProgress: useSetting('readingProgress'),
		keepAwake: useSetting('keepAwake')
	};
}
