import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface IconButtonProps {
	icon: ReactNode;
	label: string;
	onPress: () => void;
	selected?: boolean;
	disabled?: boolean;
}

export function IconButton({
	icon,
	label,
	onPress,
	selected = false,
	disabled = false
}: IconButtonProps): ReactElement {
	const { colour, layout, radius } = useTheme();

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ selected, disabled }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.base,
				{
					width: layout.touch,
					height: layout.touch,
					borderRadius: radius.pill,
					backgroundColor: pressed ? colour.pressed : 'transparent',
					opacity: disabled ? 0.45 : 1
				}
			]}
		>
			{icon}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: { alignItems: 'center', justifyContent: 'center' }
});

export default IconButton;
