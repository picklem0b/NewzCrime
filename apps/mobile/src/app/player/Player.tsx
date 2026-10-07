import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	ArrowSquareOutIcon,
	MicrophoneIcon,
	PauseIcon,
	PlayIcon,
	SkipBackIcon,
	SkipForwardIcon
} from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Button from '@/components/ui/Button';
import Column from '@/components/ui/Column';
import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useItem } from '@/hooks/useItem';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { usePlayerStore } from '@/stores/player.store';
import { openExternalUrl } from '@/utils/external';
import { formatDuration } from '@/utils/time';

const SKIP_SECONDS = 15;

export default function PlayerScreen(): ReactElement {
	const { itemId } = useLocalSearchParams<{ itemId?: string }>();
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();
	const [barWidth, setBarWidth] = useState(0);

	const { state: requested } = useItem(itemId ?? '');
	const play = usePlayerStore(state => state.play);
	const player = usePlayer();
	const sourceIndex = useSourceIndex();

	const requestedItem =
		requested.status === 'success' ? requested.data : null;
	const currentId = player.current?.id;

	useEffect(() => {
		if (!requestedItem?.audioUrl) return;
		if (requestedItem.id === currentId) return;
		void play(requestedItem);
	}, [requestedItem, currentId, play]);

	const episode = player.current;
	const source = episode ? sourceIndex.get(episode.sourceId) : undefined;
	const duration = player.durationSeconds;
	const progress =
		duration > 0
			? Math.min(1, Math.max(0, player.positionSeconds / duration))
			: 0;
	const isPlaying = player.status === 'playing';
	const art = episode?.imageUrl ?? source?.logoUrl ?? null;

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Podcasts');
	};

	const onLayoutBar = (event: LayoutChangeEvent) =>
		setBarWidth(event.nativeEvent.layout.width);

	return (
		<Screen bottomInset>
			<ScreenHeader title='Now playing' onBack={goBack} />

			{episode ? (
				<Column max={520}>
					<View
						style={{
							paddingHorizontal: gutter,
							paddingTop: spacing.md,
							gap: spacing.xl
						}}
					>
						{art ? (
							<Thumb
								uri={art}
								label={source?.name}
								width='100%'
								aspectRatio={1}
							/>
						) : (
							<View
								style={{
									width: '100%',
									aspectRatio: 1,
									borderRadius: radius.md,
									backgroundColor: colour.surfaceRaised,
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<MicrophoneIcon
									size={56}
									color={colour.textFaint}
								/>
							</View>
						)}

						<View style={{ gap: spacing.xs }}>
							<Text variant='h2' numberOfLines={3}>
								{episode.title}
							</Text>
							<Text
								variant='small'
								tone='muted'
								numberOfLines={1}
							>
								{source?.name ?? episode.author ?? ''}
							</Text>
						</View>

						<View>
							<Pressable
								accessibilityRole='adjustable'
								accessibilityLabel='Playback position'
								accessibilityValue={{
									text: `${formatDuration(player.positionSeconds)} of ${formatDuration(duration)}`
								}}
								accessibilityActions={[
									{
										name: 'increment',
										label: 'Forward 15 seconds'
									},
									{
										name: 'decrement',
										label: 'Back 15 seconds'
									}
								]}
								onAccessibilityAction={event => {
									void player.skipBy(
										event.nativeEvent.actionName ===
											'increment'
											? SKIP_SECONDS
											: -SKIP_SECONDS
									);
								}}
								onLayout={onLayoutBar}
								onPress={event => {
									if (barWidth <= 0 || duration <= 0) return;
									const ratio = Math.min(
										1,
										Math.max(
											0,
											event.nativeEvent.locationX /
												barWidth
										)
									);
									void player.seekTo(ratio * duration);
								}}
								style={styles.track}
							>
								<View
									style={[
										styles.rail,
										{ backgroundColor: colour.borderStrong }
									]}
								>
									<View
										style={{
											width: `${Math.round(progress * 100)}%`,
											height: '100%',
											backgroundColor: colour.accent
										}}
									/>
								</View>
							</Pressable>

							<View style={styles.times}>
								<Text variant='meta' tone='faint'>
									{formatDuration(player.positionSeconds)}
								</Text>
								<Text variant='meta' tone='faint'>
									{formatDuration(duration)}
								</Text>
							</View>
						</View>

						<View style={[styles.controls, { gap: spacing.md }]}>
							<IconButton
								label='Previous episode'
								disabled={
									player.queue.length === 0 && !player.current
								}
								onPress={() => {
									void player.previous();
								}}
								icon={
									<SkipBackIcon
										size={26}
										color={colour.text}
										weight='fill'
									/>
								}
							/>

							<Pressable
								accessibilityRole='button'
								accessibilityLabel={`Back ${SKIP_SECONDS} seconds`}
								onPress={() => {
									void player.skipBy(-SKIP_SECONDS);
								}}
								style={styles.skip}
							>
								<Text
									variant='small'
									style={{ fontWeight: '700' }}
								>
									−{SKIP_SECONDS}s
								</Text>
							</Pressable>

							<Pressable
								accessibilityRole='button'
								accessibilityLabel={
									isPlaying ? 'Pause' : 'Play'
								}
								onPress={() => {
									void player.toggle();
								}}
								style={({ pressed }) => [
									styles.main,
									{
										borderRadius: radius.pill,
										backgroundColor: pressed
											? colour.accent
											: colour.primary
									}
								]}
							>
								{isPlaying ? (
									<PauseIcon
										size={30}
										color={colour.onPrimary}
										weight='fill'
									/>
								) : (
									<PlayIcon
										size={30}
										color={colour.onPrimary}
										weight='fill'
									/>
								)}
							</Pressable>

							<Pressable
								accessibilityRole='button'
								accessibilityLabel={`Forward ${SKIP_SECONDS} seconds`}
								onPress={() => {
									void player.skipBy(SKIP_SECONDS);
								}}
								style={styles.skip}
							>
								<Text
									variant='small'
									style={{ fontWeight: '700' }}
								>
									+{SKIP_SECONDS}s
								</Text>
							</Pressable>

							<IconButton
								label='Next episode'
								onPress={() => {
									void player.next();
								}}
								icon={
									<SkipForwardIcon
										size={26}
										color={colour.text}
										weight='fill'
									/>
								}
							/>
						</View>

						{player.error ? (
							<Text
								variant='small'
								tone='danger'
								style={styles.centred}
							>
								{player.error}
							</Text>
						) : null}

						<Button
							label='Open episode page'
							variant='quiet'
							icon={
								<ArrowSquareOutIcon
									size={18}
									color={colour.accent}
								/>
							}
							onPress={() => {
								void openExternalUrl(episode.url);
							}}
						/>
					</View>
				</Column>
			) : (
				<EmptyState
					icon={<MicrophoneIcon size={32} color={colour.textMuted} />}
					title='Nothing is playing'
					message='Pick an episode from the Podcasts tab and it will play here.'
					action={
						<Button
							label='Browse podcasts'
							variant='secondary'
							fullWidth={false}
							onPress={() => router.replace('/tabs/Podcasts')}
						/>
					}
				/>
			)}
		</Screen>
	);
}

const styles = StyleSheet.create({
	track: { height: 44, justifyContent: 'center' },
	rail: { height: 4, borderRadius: 2, overflow: 'hidden' },
	times: { flexDirection: 'row', justifyContent: 'space-between' },
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	skip: {
		minWidth: 48,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center'
	},
	main: {
		width: 68,
		height: 68,
		alignItems: 'center',
		justifyContent: 'center'
	},
	centred: { textAlign: 'center' }
});
