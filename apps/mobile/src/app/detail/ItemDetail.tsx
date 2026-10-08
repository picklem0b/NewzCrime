import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	ArrowLeftIcon,
	ArrowSquareOutIcon,
	PauseIcon,
	PlayIcon,
	ShareNetworkIcon,
	SpeakerHighIcon,
	StopIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import SaveButton from '@/components/feed/SaveButton';
import StoryKicker from '@/components/feed/StoryKicker';
import StoryRow from '@/components/feed/StoryRow';
import Screen from '@/components/layout/Screen';
import Button from '@/components/ui/Button';
import Column from '@/components/ui/Column';
import IconButton from '@/components/ui/IconButton';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useItem } from '@/hooks/useItem';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { useSpeech, useStopSpeechOnUnmount } from '@/hooks/useSpeech';
import { useSourceIndex, useSourceItems } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { openExternalUrl, shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';

export default function ItemDetailScreen(): ReactElement {
	const { itemId } = useLocalSearchParams<{ itemId?: string }>();
	const router = useRouter();
	const { colour, layout, spacing } = useTheme();
	const { gutter, isWide } = useLayout();

	const { state, reload } = useItem(itemId ?? '');
	const sourceIndex = useSourceIndex();
	const { speakingId, speak, stop } = useSpeech();
	const player = usePlayer();

	useStopSpeechOnUnmount();

	const item = state.status === 'success' ? state.data : null;
	const source = item ? sourceIndex.get(item.sourceId) : undefined;
	const sourceName = source?.name;
	const related = useSourceItems(item?.sourceId ?? '');
	const relatedItems =
		related.state.status === 'success'
			? related.state.data.items
					.filter(entry => entry.id !== item?.id)
					.slice(0, 3)
			: [];

	const isSpeaking = item !== null && speakingId === item.id;
	const isPlaying =
		item !== null &&
		player.current?.id === item.id &&
		player.status === 'playing';
	const isJudgment = item?.type === 'court_ruling';
	const isEpisode = Boolean(item?.audioUrl);

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Home');
	};

	const openSource = () => {
		if (item) void openExternalUrl(item.url);
	};

	const readLabel = isJudgment
		? `Read the full judgment${sourceName ? ` on ${sourceName}` : ''}`
		: `Read the full story${sourceName ? ` on ${sourceName}` : ''}`;

	return (
		<Screen showPlayer>
			<View
				style={[
					styles.topBar,
					{
						minHeight: layout.touch + spacing.sm,
						paddingHorizontal: spacing.xs
					}
				]}
			>
				<IconButton
					label='Go back'
					onPress={goBack}
					icon={<ArrowLeftIcon size={22} color={colour.text} />}
				/>
				<View style={styles.topActions}>
					{item ? (
						<>
							<IconButton
								label='Share'
								onPress={() => {
									void shareItem(item);
								}}
								icon={
									<ShareNetworkIcon
										size={22}
										color={colour.text}
									/>
								}
							/>
							<SaveButton item={item} size={24} />
						</>
					) : null}
				</View>
			</View>

			{state.status === 'loading' || state.status === 'idle' ? (
				<ListSkeleton rows={3} />
			) : null}

			{state.status === 'error' ? (
				<ErrorState message={state.error} onRetry={reload} />
			) : null}

			{item ? (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: spacing.xxxl }}
				>
					<Column max={layout.readingMax + gutter * 2}>
						{item.imageUrl ? (
							<Thumb
								uri={item.imageUrl}
								label={sourceName}
								width='100%'
								aspectRatio={layout.heroAspect}
								rounded={isWide}
							/>
						) : null}

						<View
							style={{
								paddingHorizontal: gutter,
								paddingTop: spacing.lg,
								gap: spacing.md
							}}
						>
							<StoryKicker item={item} />

							<Text
								variant={isWide ? 'display' : 'h1'}
								accessibilityRole='header'
							>
								{item.title}
							</Text>

							<View style={{ gap: spacing.xxs }}>
								<Text
									variant='small'
									style={{ fontWeight: '600' }}
								>
									{item.author
										? `By ${item.author}`
										: (sourceName ?? '')}
								</Text>
								<Text variant='meta' tone='faint'>
									{item.author && sourceName
										? `${sourceName} · `
										: ''}
									{formatRelativeTime(item.publishedAt)}
								</Text>
							</View>

							{item.excerpt ? (
								<Text
									variant='standfirst'
									style={{ marginTop: spacing.sm }}
								>
									{item.excerpt}
								</Text>
							) : null}

							<View
								style={{
									gap: spacing.sm,
									marginTop: spacing.md
								}}
							>
								{isEpisode ? (
									<Button
										label={
											isPlaying
												? 'Pause episode'
												: 'Play episode'
										}
										icon={
											isPlaying ? (
												<PauseIcon
													size={20}
													color={colour.onPrimary}
													weight='fill'
												/>
											) : (
												<PlayIcon
													size={20}
													color={colour.onPrimary}
													weight='fill'
												/>
											)
										}
										onPress={() => {
											if (isPlaying) {
												void player.toggle();
												return;
											}
											void player.play(item);
										}}
									/>
								) : null}

								<Button
									label={readLabel}
									variant={
										isEpisode ? 'secondary' : 'primary'
									}
									icon={
										<ArrowSquareOutIcon
											size={20}
											color={
												isEpisode
													? colour.text
													: colour.onPrimary
											}
										/>
									}
									onPress={openSource}
								/>

								{!isEpisode ? (
									<Button
										label={
											isSpeaking
												? 'Stop reading'
												: 'Listen to summary'
										}
										variant='quiet'
										icon={
											isSpeaking ? (
												<StopIcon
													size={20}
													color={colour.accent}
													weight='fill'
												/>
											) : (
												<SpeakerHighIcon
													size={20}
													color={colour.accent}
												/>
											)
										}
										onPress={() => {
											if (isSpeaking) {
												stop();
												return;
											}
											speak(
												item.id,
												`${item.title}. ${item.excerpt ?? ''}`
											);
										}}
									/>
								) : null}
							</View>

							<Text
								variant='meta'
								tone='faint'
								style={{ marginTop: spacing.sm }}
							>
								{isJudgment
									? 'Judgments are published by the court. NewzCrime links to the full text and does not summarise or interpret it.'
									: `Summary and link from ${sourceName ?? 'the publisher'}. Statements are the publisher's reporting; read the full story for context and sourcing.`}
							</Text>
						</View>

						{relatedItems.length > 0 ? (
							<View style={{ marginTop: spacing.xl }}>
								<SectionHeader
									title={
										sourceName
											? `More from ${sourceName}`
											: 'More from this source'
									}
								/>
								{relatedItems.map(entry => (
									<StoryRow
										key={entry.id}
										item={entry}
										compact
										sourceName={sourceName}
										onPress={() =>
											router.push({
												pathname: '/detail/ItemDetail',
												params: { itemId: entry.id }
											})
										}
									/>
								))}
							</View>
						) : null}
					</Column>
				</ScrollView>
			) : null}
		</Screen>
	);
}

const styles = StyleSheet.create({
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	topActions: { flexDirection: 'row', alignItems: 'center' }
});
