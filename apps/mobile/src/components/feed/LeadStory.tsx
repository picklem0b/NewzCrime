import type { ContentItem } from '@newzcrime/shared';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';

import StoryKicker from './StoryKicker';
import StoryMeta, { describeStory } from './StoryMeta';

export interface LeadStoryProps {
	item: ContentItem;
	sourceName?: string | undefined;
	onPress: () => void;
}

export function LeadStory({
	item,
	sourceName,
	onPress
}: LeadStoryProps): ReactElement {
	const { colour, layout, spacing } = useTheme();
	const { isWide, gutter } = useLayout();

	const image = item.imageUrl ? (
		<Thumb
			uri={item.imageUrl}
			label={sourceName}
			width='100%'
			aspectRatio={layout.heroAspect}
			rounded={isWide}
		/>
	) : null;

	const text = (
		<View
			style={{
				flex: isWide && image ? 1 : undefined,
				paddingHorizontal: isWide && image ? 0 : gutter,
				gap: spacing.sm
			}}
		>
			<StoryKicker item={item} />
			<Text variant={isWide ? 'display' : 'h2'}>{item.title}</Text>
			{item.excerpt ? (
				<Text variant='body' tone='muted' numberOfLines={3}>
					{item.excerpt}
				</Text>
			) : null}
			<StoryMeta item={item} sourceName={sourceName} />
		</View>
	);

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={describeStory(item, sourceName)}
			onPress={onPress}
			style={({ pressed }) => [
				styles.base,
				{
					paddingTop: spacing.md,
					paddingBottom: spacing.sm,
					paddingHorizontal: isWide && image ? gutter : 0,
					gap: spacing.md,
					flexDirection: isWide && image ? 'row' : 'column',
					backgroundColor: pressed ? colour.pressed : 'transparent'
				}
			]}
		>
			{image ? (
				<View style={{ flex: isWide ? 1.1 : undefined }}>{image}</View>
			) : null}
			{text}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: { alignItems: 'stretch' }
});

export default LeadStory;
