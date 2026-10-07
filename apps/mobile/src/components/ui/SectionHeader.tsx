import type { ReactElement } from 'react';
import { View } from 'react-native';

import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

import Text from './Text';

export interface SectionHeaderProps {
	title: string;
}

export function SectionHeader({ title }: SectionHeaderProps): ReactElement {
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			accessibilityRole='header'
			style={{
				marginHorizontal: gutter,
				marginTop: spacing.xl,
				paddingTop: spacing.sm,
				paddingBottom: spacing.xs,
				borderTopWidth: 2,
				borderTopColor: colour.text
			}}
		>
			<Text variant='label'>{title}</Text>
		</View>
	);
}

export default SectionHeader;
