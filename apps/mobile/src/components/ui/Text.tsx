import type { ReactElement } from 'react';
import { Text as NativeText } from 'react-native';
import type { TextProps as NativeTextProps } from 'react-native';

import { maxFontSizeMultiplier, textVariants } from '@/constants/theme';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import type { TextTone, TextVariant } from '@/types';

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
	const spec = textVariants[variant];
	const scale = spec.scalable ? textScale : 1;

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
