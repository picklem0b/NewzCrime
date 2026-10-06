import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
export interface PrimaryButtonProps {
	label: string;
	onPress: () => void;
	fullWidth?: boolean;
}
export default function PrimaryButton({
	label,
	onPress,
	fullWidth = true
}: PrimaryButtonProps): ReactElement {
	const { colour, radius, spacingX, spacingY, typography } = useTheme();
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: pressed ? colour.accent : colour.primary,
					borderRadius: radius.pill,
					paddingHorizontal: spacingX.xl,
					paddingVertical: spacingY.md,
					alignSelf: fullWidth ? 'stretch' : 'flex-start',
					opacity: pressed ? 0.9 : 1
				}
			]}
		>
			<Text
				style={{
					color: colour.onPrimary,
					fontSize: typography.size.body,
					fontWeight: typography.weight.bold,
					textAlign: 'center'
				}}
			>
				{label}
			</Text>
		</Pressable>
	);
}
const styles = StyleSheet.create({
	button: { minHeight: 48, justifyContent: 'center' }
});
