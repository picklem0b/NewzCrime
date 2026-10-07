import type { ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';

export interface EmptyStateProps {
	title: string;
	message: string;
	icon?: ReactNode;
	action?: ReactNode;
}

export function EmptyState({
	title,
	message,
	icon,
	action
}: EmptyStateProps): ReactElement {
	const { spacing } = useTheme();

	return (
		<View
			style={[
				styles.container,
				{
					paddingHorizontal: spacing.xl,
					paddingVertical: spacing.xxxl,
					gap: spacing.md
				}
			]}
		>
			{icon}
			<Text variant='h3' style={styles.centred}>
				{title}
			</Text>
			<Text variant='body' tone='muted' style={styles.centred}>
				{message}
			</Text>
			{action ? (
				<View style={{ marginTop: spacing.sm }}>{action}</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { alignItems: 'center', justifyContent: 'center' },
	centred: { textAlign: 'center' }
});

export default EmptyState;
