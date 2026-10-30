import { ArrowRightIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import { useTheme } from '@/hooks/useTheme';

export interface SearchFeatureRowProps {
	label: string;
	description: string;
	icon: ReactNode;
	onPress: () => void;
}

/** A shortcut that turns a search query into a place in the app. */
export function SearchFeatureRow({
	label,
	description,
	icon,
	onPress
}: SearchFeatureRowProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={`${label}. ${description}`}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				{
					marginHorizontal: spacing.md,
					padding: spacing.md,
					gap: spacing.md,
					borderRadius: radius.md,
					backgroundColor: pressed ? colour.pressed : 'transparent'
				}
			]}
		>
			<View
				style={{
					width: 36,
					height: 36,
					borderRadius: radius.md,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: colour.accentSoft
				}}
			>
				{icon}
			</View>
			<View style={{ flex: 1 }}>
				<Text variant='body' style={{ fontWeight: '600' }}>
					{label}
				</Text>
				<Text variant='meta' tone='faint' numberOfLines={1}>
					{description}
				</Text>
			</View>
			<ArrowRightIcon size={16} color={colour.textFaint} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' }
});

export default SearchFeatureRow;
