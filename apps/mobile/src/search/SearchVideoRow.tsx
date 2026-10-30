import type { ContentItem, Source } from '@newzcrime/shared';
import { PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';
import { formatViewCount, isLiveVideo } from '@/utils/watch';

const THUMB_WIDTH = 148;

export interface SearchVideoRowProps {
	item: ContentItem;
	source?: Source | undefined;
	onPress: () => void;
}

/**
 * A search result shaped like the place the video comes from.
 *
 * A story row with a square thumbnail hides the one thing that identifies a
 * video: its frame. The 16:9 still carries the channel, the live state and the
 * play affordance before the title is read.
 */
export function SearchVideoRow({
	item,
	source,
	onPress
}: SearchVideoRowProps): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const live = isLiveVideo(item);
	const views = formatViewCount(item.viewCount);

	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={`${item.title}. ${source?.name ?? 'YouTube'}. ${
				live ? 'Live. ' : ''
			}${views ?? ''} ${formatRelativeTime(item.publishedAt)}`}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				{
					paddingHorizontal: spacing.md,
					paddingVertical: spacing.md,
					gap: spacing.md,
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderBottomColor: colour.border,
					backgroundColor: pressed ? colour.pressed : 'transparent'
				}
			]}
		>
			<View
				style={[
					styles.thumb,
					{
						width: THUMB_WIDTH,
						borderRadius: radius.md,
						borderColor: colour.border,
						backgroundColor: colour.surfaceRaised
					}
				]}
			>
				<Thumb
					uri={item.imageUrl ?? ''}
					label={source?.name}
					width='100%'
					aspectRatio={16 / 9}
					rounded={false}
				/>
				<View
					style={[
						styles.play,
						{ backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: radius.pill }
					]}
				>
					<PlayIcon size={14} color='#FFFFFF' weight='fill' />
				</View>
				{live ? (
					<View
						style={[
							styles.live,
							{ backgroundColor: colour.danger, borderRadius: radius.sm }
						]}
					>
						<Text variant='label' style={{ color: '#FFFFFF' }}>
							Live
						</Text>
					</View>
				) : null}
			</View>

			<View style={styles.text}>
				<Text variant='h4' numberOfLines={3}>
					{item.title}
				</Text>
				<Text variant='meta' tone='muted' numberOfLines={1}>
					{source?.name ?? item.author ?? 'YouTube channel'}
				</Text>
				<Text variant='meta' tone='faint' numberOfLines={1}>
					{[views, formatRelativeTime(item.publishedAt)]
						.filter(Boolean)
						.join(' · ')}
				</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'flex-start' },
	thumb: {
		flexShrink: 0,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth
	},
	play: {
		position: 'absolute',
		right: 6,
		bottom: 6,
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center'
	},
	live: {
		position: 'absolute',
		top: 6,
		left: 6,
		paddingHorizontal: 6,
		paddingVertical: 2
	},
	text: { flex: 1, gap: 2 }
});

export default SearchVideoRow;
