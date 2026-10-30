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
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import {
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

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
import Skeleton from '@/components/ui/Skeleton';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import YouTubePlayer from '@/components/youtube/YouTubePlayer';
import { useItem } from '@/hooks/useItem';
import { useItemContent } from '@/hooks/useItemContent';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { useReaderType } from '@/hooks/useReaderType';
import { useSetting } from '@/hooks/useSettings';
import { useSpeech, useStopSpeechOnUnmount } from '@/hooks/useSpeech';
import { useSourceIndex, useSourceItems } from '@/hooks/useSources';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { textVariants } from '@/constants/theme';
import { openExternalUrl, shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';
import { youtubeVideoId } from '@/utils/youtube';

export default function ItemDetailScreen(): ReactElement {
	const { itemId } = useLocalSearchParams<{ itemId?: string }>();
	const router = useRouter();
	const { colour, layout, spacing, scheme } = useTheme();
	const { gutter, isWide } = useLayout();
	const { width: windowWidth } = useWindowDimensions();

	const { state, reload } = useItem(itemId ?? '');
	const sourceIndex = useSourceIndex();
	const { speakingId, speak, stop } = useSpeech();
	const player = usePlayer();
	const reader = useReaderType();
	const textScale = useTextScale();
	const articleWidth = useSetting('articleWidth');
	const sepiaReading = useSetting('sepiaReading');
	const [scrollProgress, setScrollProgress] = useState(0);

	useStopSpeechOnUnmount();

	/** Reader settings: hold the screen awake only while they are reading. */
	useEffect(() => {
		if (!reader.keepAwake) return undefined;

		let active = true;
		const tag = 'newzcrime-reader';

		void import('expo-keep-awake')
			.then(module => (active ? module.activateKeepAwakeAsync(tag) : undefined))
			.catch(() => undefined);

		return () => {
			active = false;
			void import('expo-keep-awake')
				.then(module => module.deactivateKeepAwake(tag))
				.catch(() => undefined);
		};
	}, [reader.keepAwake]);

	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
		const scrollable = contentSize.height - layoutMeasurement.height;
		setScrollProgress(
			scrollable > 0
				? Math.min(1, Math.max(0, contentOffset.y / scrollable))
				: 0
		);
	};

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
	const videoId = item ? youtubeVideoId(item.url) : null;
	const isVideo = videoId !== null;
	const isTextItem =
		item !== null &&
		!isEpisode &&
		!isVideo &&
		item.type !== 'podcast_episode';

	const fullText = useItemContent(item?.id ?? '', isTextItem);
	const body = fullText.state.status === 'success' ? fullText.state.data.body : null;
	const hasFullText = Boolean(body);

	const articleMeasure = {
		narrow: 560,
		standard: layout.readingMax,
		wide: 820
	}[articleWidth];
	const readingMax = articleMeasure + gutter * 2;
	const readingInk = sepiaReading
		? scheme === 'dark'
			? '#F3E7D6'
			: '#2B2118'
		: colour.text;
	const sepiaSurface = scheme === 'dark' ? '#2A211A' : '#F6EDE0';
	const embedWidth = Math.max(
		0,
		Math.min(windowWidth, readingMax) - gutter * 2
	);
	const embedHeight = Math.round((embedWidth * 9) / 16);

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

	const readLabel = isVideo
		? 'Watch on YouTube'
		: isEpisode
			? 'Open episode page'
			: hasFullText
				? `Open original${sourceName ? ` on ${sourceName}` : ''}`
				: isJudgment
					? `Read the full judgment${sourceName ? ` on ${sourceName}` : ''}`
					: `Read the full story${sourceName ? ` on ${sourceName}` : ''}`;

	const listenLabel = isSpeaking
		? 'Stop reading'
		: isVideo
			? 'Listen to the description'
			: 'Listen to article';

	const paragraphs = body
		? body
				.split(/\n{2,}/)
				.map((paragraph) => paragraph.trim())
				.filter((paragraph) => paragraph.length > 0)
		: [];

	/** The embed, the audio player or the inline text is the primary action. */
	const openInBrowserIsSecondary = isEpisode || isVideo || hasFullText;

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

			{reader.showProgress && item ? (
				<View
					accessibilityRole='progressbar'
					accessibilityLabel='Reading progress'
					accessibilityValue={{ min: 0, max: 100, now: Math.round(scrollProgress * 100) }}
					style={{ height: 2, backgroundColor: colour.border }}
				>
					<View
						style={{
							width: `${Math.round(scrollProgress * 100)}%`,
							height: '100%',
							backgroundColor: colour.accent
						}}
					/>
				</View>
			) : null}

			{state.status === 'loading' || state.status === 'idle' ? (
				<ListSkeleton rows={3} />
			) : null}

			{state.status === 'error' ? (
				<ErrorState message={state.error} onRetry={reload} />
			) : null}

			{item ? (
				<ScrollView
					showsVerticalScrollIndicator={false}
					onScroll={onScroll}
					scrollEventThrottle={32}
					contentContainerStyle={{ paddingBottom: spacing.xxxl }}
				>
					<Column max={readingMax}>
						{item.imageUrl && !isVideo ? (
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
									style={{
										marginTop: spacing.sm,
										textAlign: reader.textAlign,
										lineHeight:
											textVariants.standfirst.lineHeight *
											textScale *
											reader.lineHeight
									}}
								>
									{item.excerpt}
								</Text>
							) : null}

							{videoId ? (
								<View
									style={{ gap: spacing.xs, marginTop: spacing.sm }}
								>
									<YouTubePlayer
										videoId={videoId}
										width={embedWidth}
										height={embedHeight}
									/>
									<Text variant='meta' tone='faint'>
										The video plays inside the app while this screen is open.
										YouTube does not allow background or audio-only playback.
									</Text>
								</View>
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
										openInBrowserIsSecondary ? 'secondary' : 'primary'
									}
									icon={
										<ArrowSquareOutIcon
											size={20}
											color={
												openInBrowserIsSecondary
													? colour.text
													: colour.onPrimary
											}
										/>
									}
									onPress={openSource}
								/>

								{!isEpisode ? (
									<Button
										label={listenLabel}
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
											}											speak(
												item.id,
												`${item.title}. ${body ?? item.excerpt ?? ''}`
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
								{isVideo
									? `Video from ${sourceName ?? 'the publisher'}. YouTube does not permit background playback, so the video pauses when you leave this screen.`
									: isJudgment
										? hasFullText
											? `Full judgment from ${sourceName ?? 'the court'}, reproduced for readers. The judgment is the court's text; NewzCrime does not interpret it.`
											: 'Judgments are published by the court. NewzCrime links to the full text and does not summarise or interpret it.'
										: hasFullText
											? `Full text from ${sourceName ?? 'the publisher'}, reproduced for readers. Copyright remains with the publisher.`
											: `Summary and link from ${sourceName ?? 'the publisher'}. The publisher did not provide a readable full text; open the original for the complete story.`}
							</Text>
						</View>

						{isTextItem && fullText.state.status !== 'idle' ? (
							<View>
								<SectionHeader
									title={isJudgment ? 'Full judgment' : 'Full story'}
								/>

								<View
									style={{
										paddingHorizontal: sepiaReading ? spacing.lg : gutter,
										paddingTop: spacing.sm,
										paddingBottom: sepiaReading ? spacing.lg : 0,
										marginHorizontal: sepiaReading ? gutter : 0,
										borderRadius: sepiaReading ? 12 : 0,
										backgroundColor: sepiaReading ? sepiaSurface : 'transparent',
										gap: spacing.md
									}}
								>
									{fullText.state.status === 'loading' ? (
										<View style={{ gap: spacing.md, paddingVertical: spacing.xs }}>
											<Skeleton width='100%' height={14} rounded='sm' />
											<Skeleton width='96%' height={14} rounded='sm' />
											<Skeleton width='99%' height={14} rounded='sm' />
											<Skeleton width='72%' height={14} rounded='sm' />
										</View>
									) : null}

									{fullText.state.status === 'error' ? (
										<>
											<Text variant='small' tone='muted'>
												The full text could not be loaded just now.
											</Text>
											<Button
												label='Try again'
												variant='quiet'
												onPress={fullText.reload}
											/>
										</>
									) : null}

									{fullText.state.status === 'success' && !hasFullText ? (
										<Text variant='small' tone='muted'>
											The publisher's page did not provide a readable full
											text. It may be paywalled, login-only or blocked. Open the
											original for the complete story.
										</Text>
									) : null}

									{paragraphs.map((paragraph, index) => (
										<Text
											key={`${index}-${paragraph.slice(0, 24)}`}
											variant='body'
											selectable
											style={{
												textAlign: reader.textAlign,
												color: readingInk,
												lineHeight:
													textVariants.body.lineHeight *
													textScale *
													reader.lineHeight
											}}
										>
											{paragraph}
										</Text>
									))}

									{hasFullText ? (
										<Button
											label={`Open original${sourceName ? ` on ${sourceName}` : ''}`}
											variant='quiet'
											icon={
												<ArrowSquareOutIcon
													size={18}
													color={colour.accent}
												/>
											}
											onPress={openSource}
										/>
									) : null}
								</View>
							</View>
						) : null}

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
