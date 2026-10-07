import type { Source } from '@newzcrime/shared';
import { CaretRightIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

export interface SourceRowProps {
	source: Source;
	onPress: () => void;
}

export function SourceRow({ source, onPress }: SourceRowProps): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View
			style={{
				marginHorizontal: gutter,
				borderBottomWidth: StyleSheet.hairlineWidth,
				borderBottomColor: colour.border
			}}
		>
			<Pressable
				accessibilityRole='button'
				accessibilityLabel={source.name}
				onPress={onPress}
				style={({ pressed }) => [
					styles.row,
					{
						minHeight: 60,
						paddingVertical: spacing.sm,
						gap: spacing.md,
						backgroundColor: pressed
							? colour.pressed
							: 'transparent'
					}
				]}
			>
				{source.logoUrl ? (
					<Thumb
						uri={source.logoUrl}
						label={source.name}
						width={40}
						height={40}
					/>
				) : (
					<View
						style={{
							width: 40,
							height: 40,
							borderRadius: radius.md,
							backgroundColor: colour.surfaceRaised,
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<Text variant='h3' tone='muted'>
							{source.name.trim().charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View style={styles.text}>
					<Text
						variant='body'
						style={{ fontWeight: '600' }}
						numberOfLines={1}
					>
						{source.name}
					</Text>
					{source.description ? (
						<Text variant='meta' tone='faint' numberOfLines={1}>
							{source.description}
						</Text>
					) : null}
				</View>

				<CaretRightIcon size={16} color={colour.textFaint} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' },
	text: { flex: 1 }
});

export default SourceRow;
