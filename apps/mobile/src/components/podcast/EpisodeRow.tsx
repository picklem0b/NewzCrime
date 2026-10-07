import type { ContentItem } from '@newzcrime/shared';
import { MicrophoneIcon, PauseIcon, PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';

export interface EpisodeRowProps {
	episode: ContentItem;
	showName?: string | undefined;
	artworkUri?: string | null | undefined;
	queue?: ContentItem[];
	onPress: () => void;
}

export function EpisodeRow({
	episode,
	showName,
	artworkUri,
	queue,
	onPress
}: EpisodeRowProps): ReactElement {
	const { colour, layout, radius, spacing } = useTheme();
	const { gutter } = useLayout();
	const { current, status, play, toggle } = usePlayer();

	const isCurrent = current?.id === episode.id;
	const isPlaying = isCurrent && status === 'playing';
	const isPlayable = Boolean(episode.audioUrl);
	const art = episode.imageUrl ?? artworkUri ?? null;

	return (
		<View
			style={[
				styles.row,
				{
					marginHorizontal: gutter,
					paddingVertical: spacing.md,
					gap: spacing.md,
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderBottomColor: colour.border
				}
			]}
		>
			<Pressable
				accessibilityRole='button'
				accessibilityLabel={`${episode.title}. ${showName ?? ''}. ${formatRelativeTime(episode.publishedAt)}`}
				onPress={onPress}
				style={({ pressed }) => [
					styles.body,
					{
						gap: spacing.md,
						backgroundColor: pressed
							? colour.pressed
							: 'transparent'
					}
				]}
			>
				{art ? (
					<Thumb uri={art} label={showName} width={64} height={64} />
				) : (
					<View
						style={{
							width: 64,
							height: 64,
							borderRadius: radius.md,
							backgroundColor: colour.surfaceRaised,
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<MicrophoneIcon size={24} color={colour.textFaint} />
					</View>
				)}

				<View style={styles.text}>
					{isCurrent ? (
						<Text variant='label' tone='accent'>
							{isPlaying ? 'Now playing' : 'Paused'}
						</Text>
					) : (
						<Text variant='meta' tone='faint' numberOfLines={1}>
							{formatRelativeTime(episode.publishedAt)}
							{isPlayable ? '' : ' · No audio'}
						</Text>
					)}
					<Text variant='h4' numberOfLines={3}>
						{episode.title}
					</Text>
				</View>
			</Pressable>

			{isPlayable ? (
				<Pressable
					accessibilityRole='button'
					accessibilityLabel={
						isPlaying ? 'Pause episode' : 'Play episode'
					}
					onPress={() => {
						if (isCurrent) {
							void toggle();
							return;
						}
						void play(episode, queue);
					}}
					style={({ pressed }) => ({
						width: layout.touch,
						height: layout.touch,
						borderRadius: radius.pill,
						alignItems: 'center',
						justifyContent: 'center',
						borderWidth: isPlaying ? 0 : 1,
						borderColor: colour.borderStrong,
						backgroundColor: isPlaying
							? colour.primary
							: pressed
								? colour.pressed
								: 'transparent'
					})}
				>
					{isPlaying ? (
						<PauseIcon
							size={20}
							color={colour.onPrimary}
							weight='fill'
						/>
					) : (
						<PlayIcon size={20} color={colour.text} weight='fill' />
					)}
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' },
	body: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	text: { flex: 1, gap: 2 }
});

export default EpisodeRow;
