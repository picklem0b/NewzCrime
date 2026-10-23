import type { ReactElement } from 'react';
import { Text as NativeText } from 'react-native';
import type { TextProps as NativeTextProps } from 'react-native';

import { maxFontSizeMultiplier, textVariants } from '@/constants/theme';
import { useSetting } from '@/hooks/useSettings';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import type { TextTone, TextVariant } from '@/types';

/** Variants rendered in the headline face, so the font setting applies to them. */
const HEADLINE_VARIANTS: ReadonlySet<TextVariant> = new Set([
	'masthead',
	'display',
	'h1',
	'h2',
	'h3',
	'h4'
]);

export interface TextProps extends NativeTextProps {
	variant?: TextVariant;
	tone?: TextTone;
}

export function Text({
	variant = 'body',
	tone = 'default',
	style,
	...rest
}: TextProps): ReactElement {
	const { colour } = useTheme();
	const textScale = useTextScale();
	const fontStyle = useSetting('fontStyle');
	const boldHeadlines = useSetting('boldHeadlines');
	const spec = textVariants[variant];
	const scale = spec.scalable ? textScale : 1;
	const isHeadline = HEADLINE_VARIANTS.has(variant);

	const colours: Record<TextTone, string> = {
		default: colour.text,
		muted: colour.textMuted,
		faint: colour.textFaint,
		accent: colour.accent,
		onPrimary: colour.onPrimary,
		onAccent: colour.onAccent,
		danger: colour.danger
	};

	const { scalable: _scalable, ...typeStyle } = spec;

	// The font and weight settings only touch headlines: body copy keeps the
	// platform sans, which is what long-form reading is tuned for.
	if (isHeadline) {
		if (fontStyle === 'sans') typeStyle.fontFamily = undefined;
		if (!boldHeadlines) typeStyle.fontWeight = '600';
	}

	return (
		<NativeText
			maxFontSizeMultiplier={maxFontSizeMultiplier}
			{...rest}
			style={[
				typeStyle,
				{
					color: colours[tone],
					fontSize: spec.fontSize * scale,
					lineHeight: spec.lineHeight * scale
				},
				style
			]}
		/>
	);
}

export default Text;
