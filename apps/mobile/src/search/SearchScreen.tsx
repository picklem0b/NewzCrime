import type { ContentItem, Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import {
	BookmarkSimpleIcon,
	ClockCounterClockwiseIcon,
	CompassIcon,
	FadersHorizontalIcon,
	GearIcon,
	MagnifyingGlassIcon,
	MicrophoneIcon,
	PlayCircleIcon,
	XIcon
} from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	View
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import StoryRow from '@/components/feed/StoryRow';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import ShowTile from '@/components/podcast/ShowTile';
import SourceRow from '@/components/source/SourceRow';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import SearchField from '@/components/ui/SearchField';
import Text from '@/components/ui/Text';
import ChannelTile from '@/components/watch/ChannelTile';
import { MIN_QUERY_LENGTH, useSearch, useSourceSearch } from '@/hooks/useSearch';
import { useLayout } from '@/hooks/useLayout';
import { useSetting } from '@/hooks/useSettings';
import { useSources } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import AdvancedSearchPanel from '@/search/AdvancedSearchPanel';
import SearchFeatureRow from '@/search/SearchFeatureRow';
import SearchVideoRow from '@/search/SearchVideoRow';
import { useRecentSearchesStore } from '@/stores/search.store';
import { useFollowingStore } from '@/stores/following.store';
import type {
	SearchDateRange,
	SearchScope,
	SearchSort,
	SearchTopic
} from '@/types';

const scopes: readonly { id: SearchScope; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'videos', label: 'Videos' },
	{ id: 'channels', label: 'Channels' },
	{ id: 'podcasts', label: 'Podcasts' },
	{ id: 'stories', label: 'Stories' },
	{ id: 'judgments', label: 'Judgments' }
];

/** Suggestions for a first search, drawn from what the desk covers. */
const suggestions = [
	'High Court',
	'Bail',
	'Hawks',
	'Corruption',
	'Murder trial',
	'Gender-based violence',
	'Live court',
	'True crime'
] as const;

type ShortcutRoute =
	| '/tabs/Watch'
	| '/tabs/Podcasts'
	| '/tabs/Discover'
	| '/tabs/Saved'
	| '/settings/Settings';

interface FeatureShortcut {
	id: string;
	label: string;
	description: string;
	keywords: string;
	route: ShortcutRoute;
	icon: (colour: string) => ReactNode;
}

const FEATURES: readonly FeatureShortcut[] = [
	{
		id: 'watch',
		label: 'Watch',
		description: 'Live courts, true crime and local video',
		keywords: 'watch video youtube live court channel',
		route: '/tabs/Watch',
		icon: colour => <PlayCircleIcon size={19} color={colour} />
	},
	{
		id: 'podcasts',
		label: 'Podcasts',
		description: 'Crime and court shows to listen to',
		keywords: 'podcast episode audio listen show',
		route: '/tabs/Podcasts',
		icon: colour => <MicrophoneIcon size={19} color={colour} />
	},
	{
		id: 'discover',
		label: 'Discover',
		description: 'Every channel, show and newsletter',
		keywords: 'discover follow subscribe newsletter outlet source directory',
		route: '/tabs/Discover',
		icon: colour => <CompassIcon size={19} color={colour} />
	},
	{
		id: 'library',
		label: 'Library',
		description: 'Saved stories and episodes',
		keywords: 'saved library bookmark offline',
		route: '/tabs/Saved',
		icon: colour => <BookmarkSimpleIcon size={19} color={colour} />
	},
	{
		id: 'settings',
		label: 'Settings',
		description: 'Appearance, reading and notifications',
		keywords: 'settings appearance dark mode notifications account',
		route: '/settings/Settings',
		icon: colour => <GearIcon size={19} color={colour} />
	}
];

const RANGE_MS: Record<Exclude<SearchDateRange, 'any'>, number> = {
	day: 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	month: 30 * 24 * 60 * 60 * 1000,
	year: 365 * 24 * 60 * 60 * 1000
};

function fromForRange(range: SearchDateRange): string | undefined {
	if (range === 'any') return undefined;
	return new Date(Date.now() - RANGE_MS[range]).toISOString();
}

/**
 * Search.
 *
 * One field, one set of scopes and an optional filter panel. The results are
 * grouped the way the reader thinks about the library — channels, podcasts,
 * then stories or video — rather than one flat list that hides a matching
 * channel behind twenty headlines. Video rows keep their 16:9 frame so they
 * read like the place they will open.
 */
export default function SearchScreen(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter, contentWidth } = useLayout();
	const keepHistory = useSetting('keepHistory');

	const [query, setQuery] = useState('');
	const [scope, setScope] = useState<SearchScope>('all');
	const [topic, setTopic] = useState<SearchTopic>(undefined);
	const [range, setRange] = useState<SearchDateRange>('any');
	const [sort, setSort] = useState<SearchSort>('newest');
	const [followedOnly, setFollowedOnly] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const terms = useRecentSearchesStore(state => state.terms);
	const addTerm = useRecentSearchesStore(state => state.add);
	const removeTerm = useRecentSearchesStore(state => state.remove);
	const clearTerms = useRecentSearchesStore(state => state.clear);
	const followingIds = useFollowingStore(state => state.sourceIds);

	useEffect(() => {
		if (followedOnly && followingIds.length === 0) setFollowedOnly(false);
	}, [followedOnly, followingIds.length]);

	const from = useMemo(() => fromForRange(range), [range]);
	const type = useMemo(() => {
		if (scope === 'videos') return 'video' as const;
		if (scope === 'stories') return 'article' as const;
		if (scope === 'judgments') return 'court_ruling' as const;
		if (scope === 'podcasts') return 'podcast_episode' as const;
		return undefined;
	}, [scope]);

	const itemSearchEnabled =
		scope !== 'channels' && (!followedOnly || followingIds.length > 0);
	const directorySearchEnabled =
		scope !== 'videos' && scope !== 'stories' && scope !== 'judgments';

	const search = useSearch(query, {
		type,
		topic,
		from,
		sort,
		sourceIds: followedOnly ? followingIds : undefined,
		enabled: itemSearchEnabled
	});
	const sourceSearch = useSourceSearch(query, directorySearchEnabled);
	const directory = useSources();

	const sourceIndex = useMemo(() => {
		const index = new Map<string, Source>();
		for (const source of directory.sources) index.set(source.id, source);
		return index;
	}, [directory.sources]);

	const isSearching = query.trim().length >= MIN_QUERY_LENGTH;
	const results = search.state.status === 'success' ? search.state.data : [];
	const sourceResults =
		sourceSearch.state.status === 'success' ? sourceSearch.state.data : [];

	const channels = useMemo(
		() => sourceResults.filter(source => source.contentType === 'video'),
		[sourceResults]
	);
	const shows = useMemo(
		() =>
			sourceResults.filter(
				source => source.contentType === 'podcast_episode'
			),
		[sourceResults]
	);
	const outlets = useMemo(
		() => sourceResults.filter(source => source.contentType === 'article'),
		[sourceResults]
	);

	const trimmedQuery = query.trim().toLowerCase();
	const featureMatches = useMemo(
		() =>
			FEATURES.filter(feature =>
				`${feature.label} ${feature.description} ${feature.keywords}`
					.toLowerCase()
					.includes(trimmedQuery)
			),
		[trimmedQuery]
	);

	const podcastQueue = useMemo(
		() =>
			results.filter(
				item => item.type === 'podcast_episode' && item.audioUrl
			),
		[results]
	);

	const activeFilterCount =
		(topic ? 1 : 0) +
		(range !== 'any' ? 1 : 0) +
		(sort !== 'newest' ? 1 : 0) +
		(followedOnly ? 1 : 0);

	const remember = (term: string): void => {
		if (keepHistory) addTerm(term);
	};

	const goBack = (): void => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Home');
	};

	const runSuggestion = (term: string): void => {
		setQuery(term);
		remember(term);
	};

	const openItem = (item: ContentItem): void => {
		remember(search.term || query);
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

	const openSource = (source: Source): void => {
		router.push({
			pathname: '/detail/SourceDetail',
			params: { sourceId: source.id }
		});
	};

	const retry = (): void => {
		search.reload();
		sourceSearch.reload();
	};

	const resetFilters = (): void => {
		setTopic(undefined);
		setRange('any');
		setSort('newest');
		setFollowedOnly(false);
	};

	const renderItem = (item: ContentItem): ReactElement => {
		const source = sourceIndex.get(item.sourceId);

		if (item.type === 'video') {
			return (
				<View key={item.id} style={{ marginHorizontal: gutter }}>
					<SearchVideoRow
						item={item}
						source={source}
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
					queue={podcastQueue}
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

	const itemGroupTitle =
		scope === 'videos'
			? 'Videos'
			: scope === 'podcasts'
				? 'Episodes'
				: scope === 'stories'
					? 'Stories'
					: scope === 'judgments'
						? 'Judgments'
						: 'Latest matches';

	const channelGroup = scope === 'channels' ? channels : channels.slice(0, 6);
	const showGroup = scope === 'podcasts' ? shows : shows.slice(0, 6);
	const outletGroup = outlets.slice(0, 6);

	const itemLoading =
		itemSearchEnabled &&
		(search.state.status === 'loading' || search.state.status === 'idle');
	const directoryLoading =
		directorySearchEnabled &&
		(sourceSearch.state.status === 'loading' ||
			sourceSearch.state.status === 'idle');
	const isLoading = itemLoading || directoryLoading;
	const error =
		search.state.status === 'error'
			? search.state.error
			: sourceSearch.state.status === 'error'
				? sourceSearch.state.error
				: null;
	const visibleSourceCount =
		(scope === 'all' || scope === 'channels' ? channels.length : 0) +
		(scope === 'all' || scope === 'podcasts' ? shows.length : 0) +
		(scope === 'all' ? outlets.length : 0);
	const hasResults =
		results.length > 0 ||
		visibleSourceCount > 0 ||
		(scope === 'all' && featureMatches.length > 0);
	const showEmpty =
		isSearching && !isLoading && !error && !hasResults;

	return (
		<Screen>
			<View
				style={{
					flex: 1,
					width: '100%',
					maxWidth: contentWidth,
					alignSelf: 'center'
				}}
			>
				<ScreenHeader
					title='Search'
					subtitle='Stories, channels, video and podcasts'
					onBack={goBack}
				/>

				<View
					style={{
						paddingHorizontal: gutter,
						paddingTop: spacing.sm,
						paddingBottom: spacing.sm
					}}
				>
					<SearchField
						value={query}
						onChangeText={setQuery}
						onSubmit={() => remember(query)}
						placeholder='Names, channels, shows, cases, places'
					/>
				</View>

				<ScrollView
					keyboardShouldPersistTaps='handled'
					keyboardDismissMode='on-drag'
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: spacing.xxxl }}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: spacing.sm,
							paddingLeft: gutter,
							paddingRight: gutter,
							paddingBottom: spacing.xs
						}}
					>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
							contentContainerStyle={{ gap: spacing.sm }}
							style={{ flex: 1 }}
						>
							{scopes.map(entry => (
								<Chip
									key={entry.id}
									label={entry.label}
									selected={entry.id === scope}
									onPress={() => setScope(entry.id)}
								/>
							))}
						</ScrollView>

						{scope !== 'channels' ? (
							<Pressable
								accessibilityRole='button'
								accessibilityLabel='Advanced search filters'
								accessibilityState={{ expanded: showFilters }}
								onPress={() => setShowFilters(value => !value)}
								style={({ pressed }) => [
									styles.filterButton,
									{
										minHeight: 36,
										borderRadius: radius.pill,
										paddingHorizontal: spacing.md,
										gap: spacing.xs,
										borderColor:
											showFilters || activeFilterCount > 0
												? colour.accent
												: colour.borderStrong,
										backgroundColor:
											showFilters || activeFilterCount > 0
												? colour.accentSoft
												: pressed
													? colour.pressed
													: 'transparent'
									}
								]}
							>
								<FadersHorizontalIcon
									size={15}
									color={
										showFilters || activeFilterCount > 0
											? colour.accent
											: colour.textMuted
									}
								/>
								<Text
									variant='meta'
									tone={
										showFilters || activeFilterCount > 0
											? 'accent'
											: 'muted'
									}
									style={{ fontWeight: '700' }}
								>
									{activeFilterCount > 0
										? `Filters · ${activeFilterCount}`
										: 'Filters'}
								</Text>
							</Pressable>
						) : null}
					</View>

					{showFilters && scope !== 'channels' ? (
						<AdvancedSearchPanel
							topic={topic}
							range={range}
							sort={sort}
							followedOnly={followedOnly}
							followedCount={followingIds.length}
							onTopic={setTopic}
							onRange={setRange}
							onSort={setSort}
							onFollowedOnly={setFollowedOnly}
							onReset={resetFilters}
						/>
					) : null}

					{isSearching ? (
						<>
							{isLoading && !results.length && !sourceResults.length ? (
								<View style={{ paddingTop: spacing.md }}>
									<ListSkeleton rows={5} />
								</View>
							) : null}

							{error ? (
								<ErrorState message={error} onRetry={retry} />
							) : null}

							{!error && featureMatches.length > 0 && scope === 'all' ? (
								<ResultGroup
									title='Places in the app'
									count={featureMatches.length}
								>
									{featureMatches.map(feature => (
										<SearchFeatureRow
											key={feature.id}
											label={feature.label}
											description={feature.description}
											icon={feature.icon(colour.accent)}
											onPress={() => router.push(feature.route)}
										/>
									))}
								</ResultGroup>
							) : null}

							{!error && channelGroup.length > 0 &&
							(scope === 'all' || scope === 'channels') ? (
								<ResultGroup
									title='Channels'
									count={channels.length}
									onSeeAll={
										scope === 'all' && channels.length > 6
											? () => setScope('channels')
											: undefined
									}
								>
									{channelGroup.map(source => (
										<SourceRow
											key={source.id}
											source={source}
											onPress={() => openSource(source)}
										/>
									))}
								</ResultGroup>
							) : null}

							{!error && showGroup.length > 0 &&
							(scope === 'all' || scope === 'podcasts') ? (
								<ResultGroup
									title='Podcasts'
									count={shows.length}
									onSeeAll={
										scope === 'all' && shows.length > 6
											? () => setScope('podcasts')
											: undefined
									}
								>
									{showGroup.map(source => (
										<SourceRow
											key={source.id}
											source={source}
											onPress={() => openSource(source)}
										/>
									))}
								</ResultGroup>
							) : null}

							{!error && outletGroup.length > 0 && scope === 'all' ? (
								<ResultGroup
									title='Newsletters & outlets'
									count={outlets.length}
									onSeeAll={
										outlets.length > 6
											? () => router.push('/tabs/Discover')
											: undefined
									}
								>
									{outletGroup.map(source => (
										<SourceRow
											key={source.id}
											source={source}
											onPress={() => openSource(source)}
										/>
									))}
								</ResultGroup>
							) : null}

							{!error && results.length > 0 && scope !== 'channels' ? (
								<ResultGroup title={itemGroupTitle} count={results.length}>
									{results.map(renderItem)}
								</ResultGroup>
							) : null}

							{!error && showEmpty ? (
								<EmptyState
									icon={
										<MagnifyingGlassIcon
											size={32}
											color={colour.textMuted}
										/>
									}
									title={`No results for “${search.term || query.trim()}”`}
									message={
										followedOnly
											? 'Nothing from the sources you follow matches. Try resetting the filters.'
											: 'Check the spelling, or try a channel, a show, a court or a place.'
									}
									action={
										<Button
											label='Reset filters'
											variant='secondary'
											fullWidth={false}
											onPress={resetFilters}
										/>
									}
								/>
							) : null}

							{!error && search.hasMore && scope !== 'channels' ? (
								<View
									style={{
										paddingHorizontal: gutter,
										paddingTop: spacing.lg
									}}
								>
									{search.isLoadingMore ? (
										<ActivityIndicator color={colour.textMuted} />
									) : (
										<Button
											label='Load more results'
											variant='secondary'
											onPress={search.loadMore}
										/>
									)}
								</View>
							) : null}
						</>
					) : (
						<>
							{query.trim().length > 0 ? (
								<View
									style={{
										paddingHorizontal: gutter,
										paddingVertical: spacing.sm
									}}
								>
									<Text variant='small' tone='muted'>
										{`Type at least ${MIN_QUERY_LENGTH} letters to search.`}
									</Text>
								</View>
							) : null}

							{terms.length > 0 ? (
								<View style={{ paddingTop: spacing.sm }}>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											paddingHorizontal: gutter
										}}
									>
										<Text variant='label' tone='faint'>
											Recent searches
										</Text>
										<Button
											label='Clear'
											variant='quiet'
											fullWidth={false}
											onPress={clearTerms}
										/>
									</View>

									<View
										style={{
											marginHorizontal: gutter,
											marginTop: spacing.xs,
											borderRadius: radius.lg,
											backgroundColor: colour.surface,
											borderWidth: StyleSheet.hairlineWidth,
											borderColor: colour.border,
											overflow: 'hidden'
										}}
									>
										{terms.map((term, index) => (
											<View
												key={term}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													borderBottomWidth:
														index === terms.length - 1
															? 0
															: StyleSheet.hairlineWidth,
													borderBottomColor: colour.border
												}}
											>
												<Pressable
													accessibilityRole='button'
													accessibilityLabel={`Search again for ${term}`}
													onPress={() => runSuggestion(term)}
													style={({ pressed }) => [
														styles.recentTerm,
														{
															gap: spacing.md,
															paddingLeft: spacing.lg,
															backgroundColor: pressed
																? colour.pressed
																: 'transparent'
														}
													]}
												>
													<ClockCounterClockwiseIcon
														size={18}
														color={colour.textMuted}
													/>
													<Text
														variant='body'
														numberOfLines={1}
														style={styles.flex}
													>
														{term}
													</Text>
												</Pressable>
												<IconButton
													label={`Remove ${term} from recent searches`}
													onPress={() => removeTerm(term)}
													icon={
														<XIcon
															size={16}
															color={colour.textMuted}
														/>
													}
												/>
											</View>
										))}
									</View>
								</View>
							) : null}

							<ResultGroup title='Jump straight in' count={FEATURES.length}>
								{FEATURES.map(feature => (
									<SearchFeatureRow
										key={feature.id}
										label={feature.label}
										description={feature.description}
										icon={feature.icon(colour.accent)}
										onPress={() => router.push(feature.route)}
									/>
								))}
							</ResultGroup>

							<View style={{ paddingTop: spacing.xl }}>
								<Text
									variant='label'
									tone='faint'
									style={{ paddingHorizontal: gutter }}
								>
									Try searching for
								</Text>
								<View
									style={{
										flexDirection: 'row',
										flexWrap: 'wrap',
										paddingHorizontal: gutter,
										paddingTop: spacing.sm,
										gap: spacing.sm
									}}
								>
									{suggestions.map(term => (
										<Chip
											key={term}
											label={term}
											selected={false}
											onPress={() => runSuggestion(term)}
										/>
									))}
								</View>
							</View>

							{directory.sources.some(
								source => source.contentType === 'video'
							) ? (
								<View style={{ paddingTop: spacing.xl }}>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'baseline',
											justifyContent: 'space-between',
											paddingHorizontal: gutter
										}}
									>
										<Text variant='h4'>YouTube channels</Text>
										<Pressable
											accessibilityRole='button'
											accessibilityLabel='Browse every channel'
											onPress={() => router.push('/tabs/Discover')}
										>
											<Text variant='meta' tone='accent'>
												Browse all
											</Text>
										</Pressable>
									</View>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										keyboardShouldPersistTaps='handled'
										contentContainerStyle={{
											paddingHorizontal: gutter,
											paddingTop: spacing.md,
											gap: spacing.md
										}}
									>
										{directory.sources
											.filter(source => source.contentType === 'video')
											.slice(0, 10)
											.map(channel => (
												<ChannelTile
													key={channel.id}
													channel={channel}
													onPress={() => openSource(channel)}
												/>
											))}
									</ScrollView>
								</View>
							) : null}

							{directory.sources.some(
								source => source.contentType === 'podcast_episode'
							) ? (
								<View style={{ paddingTop: spacing.xl }}>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'baseline',
											justifyContent: 'space-between',
											paddingHorizontal: gutter
										}}
									>
										<Text variant='h4'>Podcasts</Text>
										<Pressable
											accessibilityRole='button'
											accessibilityLabel='Browse every podcast'
											onPress={() => router.push('/tabs/Podcasts')}
										>
											<Text variant='meta' tone='accent'>
												Browse all
											</Text>
										</Pressable>
									</View>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										keyboardShouldPersistTaps='handled'
										contentContainerStyle={{
											paddingHorizontal: gutter,
											paddingTop: spacing.md,
											gap: spacing.md
										}}
									>
										{directory.sources
											.filter(
												source =>
													source.contentType === 'podcast_episode'
											)
											.slice(0, 10)
											.map(show => (
												<ShowTile
													key={show.id}
													show={show}
													selected={false}
													onPress={() => openSource(show)}
												/>
											))}
									</ScrollView>
								</View>
							) : null}

							<View
								style={{
									paddingHorizontal: gutter,
									paddingTop: spacing.xl
								}}
							>
								<Button
									label='Open Discover for every source'
									variant='secondary'
									onPress={() => router.push('/tabs/Discover')}
								/>
							</View>
						</>
					)}
				</ScrollView>
			</View>
		</Screen>
	);
}

function ResultGroup({
	title,
	count,
	onSeeAll,
	children
}: {
	title: string;
	count: number;
	onSeeAll?: (() => void) | undefined;
	children: ReactNode;
}): ReactElement {
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();

	return (
		<View style={{ paddingTop: spacing.xl }}>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'baseline',
					justifyContent: 'space-between',
					paddingHorizontal: gutter,
					paddingBottom: spacing.xs
				}}
			>
				<Text variant='h4' accessibilityRole='header'>
					{title}
				</Text>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
					<Text variant='meta' tone='faint'>
						{count}
					</Text>
					{onSeeAll ? (
						<Pressable
							accessibilityRole='button'
							accessibilityLabel={`See all ${title.toLowerCase()}`}
							onPress={onSeeAll}
							hitSlop={8}
						>
							<Text variant='meta' tone='accent'>
								See all
							</Text>
						</Pressable>
					) : null}
				</View>
			</View>
			<View>{children}</View>
		</View>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	filterButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth
	},
	recentTerm: {
		flex: 1,
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center'
	}
});
