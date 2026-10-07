import { WarningCircleIcon, WifiSlashIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Button from '@/components/ui/Button';
import Text from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';
import { describeError } from '@/utils/errors';

export interface ErrorStateProps {
	message: string;
	onRetry?: () => void;
}

export function ErrorState({
	message,
	onRetry
}: ErrorStateProps): ReactElement {
	const { colour, spacing } = useTheme();
	const described = describeError(message);

	return (
		<View
			accessibilityRole='alert'
			style={[
				styles.container,
				{
					paddingHorizontal: spacing.xl,
					paddingVertical: spacing.xxxl,
					gap: spacing.md
				}
			]}
		>
			{described.kind === 'offline' ? (
				<WifiSlashIcon size={32} color={colour.textMuted} />
			) : (
				<WarningCircleIcon size={32} color={colour.danger} />
			)}

			<Text variant='h3' style={styles.centred}>
				{described.title}
			</Text>
			<Text variant='body' tone='muted' style={styles.centred}>
				{described.detail}
			</Text>

			{onRetry ? (
				<View style={{ marginTop: spacing.sm }}>
					<Button
						label='Try again'
						variant='secondary'
						fullWidth={false}
						onPress={onRetry}
					/>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { alignItems: 'center', justifyContent: 'center' },
	centred: { textAlign: 'center' }
});

export default ErrorState;
