import type { ReactElement, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import Text from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonProps {
	label: string;
	onPress: () => void;
	variant?: ButtonVariant;
	icon?: ReactNode;
	fullWidth?: boolean;
	disabled?: boolean;
	loading?: boolean;
}

export function Button({
	label,
	onPress,
	variant = 'primary',
	icon,
	fullWidth = true,
	disabled = false,
	loading = false
}: ButtonProps): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const isInactive = disabled || loading;

	const tone =
		variant === 'primary'
			? 'onPrimary'
			: variant === 'quiet'
				? 'accent'
				: 'default';

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ disabled: isInactive, busy: loading }}
			disabled={isInactive}
			onPress={onPress}
			style={({ pressed }) => [
				styles.base,
				{
					borderRadius: radius.lg,
					paddingHorizontal: spacing.xl,
					alignSelf: fullWidth ? 'stretch' : 'center',
					opacity: disabled ? 0.45 : 1,
					backgroundColor:
						variant === 'primary'
							? pressed
								? colour.accent
								: colour.primary
							: pressed
								? colour.pressed
								: 'transparent',
					borderWidth: variant === 'secondary' ? 1 : 0,
					borderColor: colour.borderStrong
				}
			]}
		>
			{loading ? (
				<ActivityIndicator
					color={
						variant === 'primary'
							? colour.onPrimary
							: colour.textMuted
					}
				/>
			) : (
				<View style={[styles.content, { gap: spacing.sm }]}>
					{icon}
					<Text variant='button' tone={tone}>
						{label}
					</Text>
				</View>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center' 
    },
	content: {
        flexDirection: 'row',
        alignItems: 'center' 
    }
});

export default Button;
