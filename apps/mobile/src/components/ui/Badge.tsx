import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import Text from './Text';

export interface BadgeProps {
	label: string;
	icon?: ReactNode;
	tone?: 'neutral' | 'accent';
}

export function Badge({
	label,
	icon,
	tone = 'neutral'
}: BadgeProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<View
			style={[
				styles.base,
				{
					borderRadius: radius.sm,
					paddingHorizontal: spacing.sm,
					paddingVertical: spacing.xxs,
					gap: spacing.xs,
					backgroundColor:
						tone === 'accent'
							? colour.accentSoft
							: colour.surfaceRaised,
					borderColor:
						tone === 'accent' ? 'transparent' : colour.border
				}
			]}
		>
			{icon}
			<Text variant='label' tone={tone === 'accent' ? 'accent' : 'muted'}>
				{label}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	base: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		borderWidth: StyleSheet.hairlineWidth
	}
});

export default Badge;
