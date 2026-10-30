import type { ContentItem, Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import {
	CheckCircleIcon,
	MagnifyingGlassIcon,
	NewspaperIcon,
	PlayCircleIcon
} from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import {
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	View
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import StoryRow from '@/components/feed/StoryRow';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import ShowTile from '@/components/podcast/ShowTile';
import SourceRow from '@/components/source/SourceRow';
import Chip from '@/components/ui/Chip';
import Column from '@/components/ui/Column';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import ChannelTile from '@/components/watch/ChannelTile';
import VideoRow from '@/components/watch/VideoRow';
import { useFollowingFeed } from '@/hooks/useFollowing';
import { useLayout } from '@/hooks/useLayout';
import { useSources } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { useFollowingStore } from '@/stores/following.store';

type DiscoverFilter =
	| 'all'
	| 'following'
	| 'channels'
	| 'podcasts'
	| 'newsletters';

const filters: ReadonlyArray<{ id: DiscoverFilter; label: string }> = [
	{ id: 'all', label: 'All' },
	{ id: 'following', label: 'Following' },
	{ id: 'channels', label: 'YouTube' },
	{ id: 'podcasts', label: 'Podcasts' },
	{ id: 'newsletters', label: 'Newsletters' }
];

/**
 * Discover: every source, grouped by the way it reaches the reader.
 *
 * A channel, a podcast and a newsletter are different habits, so they are
 * separate shelves rather than one alphabetical list. Following sits above
 * them: once a reader has chosen sources, their newest items are the first
 * thing on the screen.
 */
export default function DiscoverScreen(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();
	const { sources, status, error, reload } = useSources();
	const followingIds = useFollowingStore(state => state.sourceIds);
	const [filter, setFilter] = useState<DiscoverFilter>('all');

	const followingFeed = useFollowingFeed(8);

	const sourceIndex = useMemo(() => {
		const index = new Map<string, Source>();
		for (const source of sources) index.set(source.id, source);
		return index;
	}, [sources]);

	const followedSourceSet = useMemo(
		() => new Set(followingIds),
		[followingIds]
	);
	const followedSources = useMemo(
		() => sources.filter(source => followedSourceSet.has(source.id)),
		[followedSourceSet, sources]
	);

	const channels = useMemo(
		() => sources.filter(source => source.contentType === 'video'),
		[sources]
	);
	const shows = useMemo(
		() =>
			sources.filter(
				source => source.contentType === 'podcast_episode'
			),
		[sources]
	);
	const newsletters = useMemo(
		() =>
			sources.filter(
				source =>
					source.contentType !== 'video' &&
					source.contentType !== 'podcast_episode'
			),
		[sources]
	);

	const showFollowing = filter === 'all' || filter === 'following';
	const showChannels = filter === 'all' || filter === 'channels';
	const showPodcasts = filter === 'all' || filter === 'podcasts';
	const showNewsletters = filter === 'all' || filter === 'newsletters';

	const visibleSourceCount =
		(showFollowing ? followedSources.length : 0) +
		(showChannels ? channels.length : 0) +
		(showPodcasts ? shows.length : 0) +
		(showNewsletters ? newsletters.length : 0);

	const followingItems =
		followingFeed.state.status === 'success'
			? followingFeed.state.data.items
			: [];
	const followingQueue = followingItems.filter(
		item => item.type === 'podcast_episode' && item.audioUrl
	);

	const openSource = (source: Source) => {
		router.push({
			pathname: '/detail/SourceDetail',
			params: { sourceId: source.id }
		});
	};

	const openItem = (item: ContentItem) => {
		if (item.type === 'video') {
			router.push({
				pathname: '/watch/VideoDetail',
				params: { itemId: item.id, sourceId: item.sourceId }
			});
			return;
		}

		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});
	};

	const renderFollowingItem = (item: ContentItem): ReactElement => {
		const source = sourceIndex.get(item.sourceId);

		if (item.type === 'video') {
			return (
				<View key={item.id} style={{ marginHorizontal: gutter }}>
					<VideoRow
						item={item}
						sourceName={source?.name}
						onPress={() => openItem(item)}
					/>
				</View>
			);
		}

		if (item.type === 'podcast_episode') {
			return (
				<EpisodeRow
					key={item.id}
					episode={item}
					showName={source?.name}
					artworkUri={source?.logoUrl}
					queue={followingQueue}
					onPress={() => openItem(item)}
				/>
			);
		}

		return (
			<StoryRow
				key={item.id}
				item={item}
				sourceName={source?.name}
				onPress={() => openItem(item)}
			/>
		);
	};

	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: spacing.xxxl,
					gap: spacing.lg
				}}
				refreshControl={
					<RefreshControl
						refreshing={status === 'loading'}
						onRefresh={reload}
						tintColor={colour.textMuted}
						colors={[colour.accent]}
					/>
				}
			>
				<Column>
					<ScreenHeader
						title='Discover'
						subtitle='Newsletters, channels and podcasts'
						large
					/>

					<Pressable
						accessibilityRole='search'
						accessibilityLabel='Search every source'
						onPress={() => router.push('/search/Search')}
						style={({ pressed }) => [
							styles.search,
							{
								borderColor: colour.border,
								borderRadius: radius.pill,
								backgroundColor: colour.surface,
								marginHorizontal: gutter,
								paddingHorizontal: spacing.lg,
								paddingVertical: spacing.md,
								gap: spacing.sm,
								opacity: pressed ? 0.75 : 1
							}
						]}
					>
						<MagnifyingGlassIcon size={19} color={colour.accent} />
						<Text variant='body' tone='muted'>
							Search channels, shows, stories and video
						</Text>
					</Pressable>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingHorizontal: gutter,
							paddingTop: spacing.md,
							gap: spacing.sm
						}}
					>
						{filters.map(entry => (
							<Chip
								key={entry.id}
								label={entry.label}
								selected={entry.id === filter}
								onPress={() => setFilter(entry.id)}
							/>
						))}
					</ScrollView>
				</Column>

				{status === 'loading' || status === 'idle' ? (
					<ListSkeleton rows={4} />
				) : null}

				{status === 'error' ? (
					<Column>
						<ErrorState message={error ?? ''} onRetry={reload} />
					</Column>
				) : null}

				{status === 'success' && sources.length === 0 ? (
					<Column>
						<EmptyState
							icon={
								<NewspaperIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='No sources yet'
							message='Outlets, channels and shows appear once the worker has collected their feeds.'
						/>
					</Column>
				) : null}

				{status === 'success' &&
				sources.length > 0 &&
				filter !== 'all' &&
				visibleSourceCount === 0 ? (
					<Column>
						<EmptyState
							icon={
								<MagnifyingGlassIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='Nothing here yet'
							message='This shelf is empty for now. Try All, or follow a source from another shelf.'
						/>
					</Column>
				) : null}

				{status === 'success' && sources.length > 0 && showFollowing ? (
					<Column>
						<SectionHeader title='Following' />

						{followedSources.length === 0 ? (
							<View
								style={{
									marginHorizontal: gutter,
									padding: spacing.lg,
									gap: spacing.sm,
									borderRadius: radius.lg,
									borderWidth: StyleSheet.hairlineWidth,
									borderColor: colour.border,
									backgroundColor: colour.surface
								}}
							>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: spacing.sm
									}}
								>
									<CheckCircleIcon
										size={20}
										color={colour.accent}
									/>
									<Text variant='body' style={{ fontWeight: '600' }}>
										Make this yours
									</Text>
								</View>
								<Text variant='small' tone='muted'>
									Follow a newsletter, YouTube channel or podcast
									below. Their newest stories, episodes and video will
									appear here first.
								</Text>
							</View>
						) : (
							<>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										paddingHorizontal: gutter,
										paddingBottom: spacing.xs
									}}
								>
									<Text variant='meta' tone='faint'>
										{`${followedSources.length} ${
											followedSources.length === 1
												? 'source'
												: 'sources'
										} · newest first`}
									</Text>
									<Pressable
										accessibilityRole='button'
										accessibilityLabel='See every followed source'
										onPress={() => setFilter('following')}
									>
										<Text variant='meta' tone='accent'>
											Manage
										</Text>
									</Pressable>
								</View>

								{followingFeed.state.status === 'loading' ||
								followingFeed.state.status === 'idle' ? (
									<ListSkeleton rows={2} />
								) : null}

								{followingFeed.state.status === 'error' ? (
									<ErrorState
										message={followingFeed.state.error}
										onRetry={followingFeed.reload}
									/>
								) : null}

								{followingFeed.state.status === 'success' &&
								followingItems.length === 0 ? (
									<Text
										variant='small'
										tone='muted'
										style={{
											paddingHorizontal: gutter,
											paddingVertical: spacing.sm
										}}
									>
										Nothing has been collected from these sources yet.
										Pull down to check again.
									</Text>
								) : null}

								{followingItems.map(renderFollowingItem)}
							</>
						)}
					</Column>
				) : null}

				{status === 'success' && sources.length > 0 && showChannels ? (
					<Column>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingHorizontal: gutter,
								paddingTop: spacing.sm
							}}
						>
							<Text variant='h4' accessibilityRole='header'>
								YouTube channels
							</Text>
							<Text variant='meta' tone='faint'>
								{channels.length}
							</Text>
						</View>
						{channels.length > 0 ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									paddingHorizontal: gutter,
									paddingTop: spacing.md,
									paddingBottom: spacing.xs,
									gap: spacing.md
								}}
							>
								{channels.map(channel => (
									<ChannelTile
										key={channel.id}
										channel={channel}
										onPress={() => openSource(channel)}
									/>
								))}
							</ScrollView>
						) : (
							<Text
								variant='small'
								tone='muted'
								style={{ paddingHorizontal: gutter }}
							>
								No channels collected yet.
							</Text>
						)}
					</Column>
				) : null}

				{status === 'success' && sources.length > 0 && showPodcasts ? (
					<Column>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingHorizontal: gutter,
								paddingTop: spacing.sm
							}}
						>
							<Text variant='h4' accessibilityRole='header'>
								Podcasts
							</Text>
							<Text variant='meta' tone='faint'>
								{shows.length}
							</Text>
						</View>
						{shows.length > 0 ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									paddingHorizontal: gutter,
									paddingTop: spacing.md,
									paddingBottom: spacing.xs,
									gap: spacing.md
								}}
							>
								{shows.map(show => (
									<ShowTile
										key={show.id}
										show={show}
										selected={false}
										onPress={() => openSource(show)}
									/>
								))}
							</ScrollView>
						) : (
							<Text
								variant='small'
								tone='muted'
								style={{ paddingHorizontal: gutter }}
							>
								No podcasts collected yet.
							</Text>
						)}
					</Column>
				) : null}

				{status === 'success' &&
				sources.length > 0 &&
				showNewsletters ? (
					<Column>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingHorizontal: gutter,
								paddingTop: spacing.sm
							}}
						>
							<Text variant='h4' accessibilityRole='header'>
								Newsletters & outlets
							</Text>
							<Text variant='meta' tone='faint'>
								{newsletters.length}
							</Text>
						</View>
						{newsletters.length > 0 ? (
							newsletters.map(source => (
								<SourceRow
									key={source.id}
									source={source}
									onPress={() => openSource(source)}
								/>
							))
						) : (
							<Text
								variant='small'
								tone='muted'
								style={{ paddingHorizontal: gutter }}
							>
								No newsletters collected yet.
							</Text>
						)}
					</Column>
				) : null}

				{status === 'success' && sources.length > 0 ? (
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: spacing.sm,
							paddingHorizontal: gutter
						}}
					>
						<PlayCircleIcon size={16} color={colour.textFaint} />
						<Text variant='meta' tone='faint' style={{ flex: 1 }}>
							New items appear from every source after the next
							collection run. Follow a source to keep it close.
						</Text>
					</View>
				) : null}
			</ScrollView>
		</TabScreen>
	);
}

const styles = StyleSheet.create({
	search: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 48,
		borderWidth: StyleSheet.hairlineWidth
	}
});
