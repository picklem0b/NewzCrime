import type { ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import Text from './Text';

export interface ChipProps {
	label: string;
	selected: boolean;
	onPress: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			accessibilityState={{ selected }}
			onPress={onPress}
			hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
			style={({ pressed }) => [
				styles.base,
				{
					borderRadius: radius.pill,
					paddingHorizontal: spacing.lg,
					borderColor: selected ? colour.accent : colour.borderStrong,
					backgroundColor: selected
						? colour.accent
						: pressed
							? colour.pressed
							: 'transparent'
				}
			]}
		>
			<Text
				variant='small'
				tone={selected ? 'onAccent' : 'muted'}
				style={{ fontWeight: selected ? '700' : '500' }}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth
	}
});

export default Chip;
