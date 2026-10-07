import type { ContentItem } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

import StoryKicker from './StoryKicker';
import StoryMeta, { describeStory } from './StoryMeta';

export interface StoryRowProps {
	item: ContentItem;
	sourceName?: string | undefined;
	onPress: () => void;
	compact?: boolean;
}

export function StoryRow({
	item,
	sourceName,
	onPress,
	compact = false
}: StoryRowProps): ReactElement {
	const { colour, layout, spacing } = useTheme();
	const { gutter } = useLayout();
	const showThumb = !compact && Boolean(item.imageUrl);

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
				accessibilityLabel={describeStory(item, sourceName)}
				onPress={onPress}
				style={({ pressed }) => [
					styles.row,
					{
						paddingTop: spacing.md,
						gap: spacing.md,
						backgroundColor: pressed
							? colour.pressed
							: 'transparent'
					}
				]}
			>
				<View style={[styles.text, { gap: spacing.xs }]}>
					<StoryKicker item={item} />
					<Text
						variant={compact ? 'h4' : 'h3'}
						numberOfLines={compact ? 3 : 4}
					>
						{item.title}
					</Text>
					<StoryMeta item={item} sourceName={sourceName} />
				</View>

				{showThumb && item.imageUrl ? (
					<View style={{ paddingBottom: spacing.sm }}>
						<Thumb
							uri={item.imageUrl}
							label={sourceName}
							width={layout.rowThumb.width}
							height={layout.rowThumb.height}
						/>
					</View>
				) : null}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'flex-start' },
	text: { flex: 1 }
});

export default StoryRow;
