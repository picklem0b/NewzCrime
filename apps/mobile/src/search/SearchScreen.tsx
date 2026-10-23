import { FlashList } from '@shopify/flash-list';
import type { ContentItem, Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import {
	ClockCounterClockwiseIcon,
	MagnifyingGlassIcon,
	XIcon
} from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
	ActivityIndicator,
	Animated,
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
import SourceRow from '@/components/source/SourceRow';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Column from '@/components/ui/Column';
import IconButton from '@/components/ui/IconButton';
import SearchField from '@/components/ui/SearchField';
import Text from '@/components/ui/Text';
import { MIN_QUERY_LENGTH, useSearch } from '@/hooks/useSearch';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useLayout } from '@/hooks/useLayout';
import { useSetting } from '@/hooks/useSettings';
import { useSources, useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { useRecentSearchesStore } from '@/stores/search.store';
import type { SearchScope } from '@/types';

const scopes: readonly { id: SearchScope; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'stories', label: 'Stories' },
	{ id: 'judgments', label: 'Judgments' },
	{ id: 'episodes', label: 'Episodes' }
];

/** Suggestions for a first search, drawn from what the desk covers. */
const suggestions = [
	'High Court',
	'Bail',
	'Hawks',
	'Corruption',
	'Murder trial',
	'Gender-based violence',
	'Supreme Court of Appeal',
	'Magistrate'
] as const;

const inScope = (item: ContentItem, scope: SearchScope): boolean => {
	if (scope === 'all') return true;
	if (scope === 'judgments') return item.type === 'court_ruling';
	if (scope === 'episodes') return item.type === 'podcast_episode';
	return item.type === 'article';
};

/**
 * Search.
 *
 * A back header like Settings, a field that stays in reach, and results that
 * fade in rather than snapping. The idle state is a real screen: recent
 * searches, suggested queries and the outlet directory, so opening Search with
 * nothing typed is useful instead of blank.
 */
export default function SearchScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();
	const motion = useAppMotion();
	const keepHistory = useSetting('keepHistory');

	const [query, setQuery] = useState('');
	const [scope, setScope] = useState<SearchScope>('all');
	const fade = useRef(new Animated.Value(1)).current;

	const search = useSearch(query);
	const sourceIndex = useSourceIndex();
	const sources = useSources();
	const terms = useRecentSearchesStore(state => state.terms);
	const addTerm = useRecentSearchesStore(state => state.add);
	const removeTerm = useRecentSearchesStore(state => state.remove);
	const clearTerms = useRecentSearchesStore(state => state.clear);

	const isSearching = query.trim().length >= MIN_QUERY_LENGTH;
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

	useEffect(() => {
		setScope('all');
	}, [search.term]);

	const results = useMemo(
		() => (search.state.status === 'success' ? search.state.data : []),
		[search.state]
	);
	const scoped = useMemo(
		() => results.filter(item => inScope(item, scope)),
		[results, scope]
	);

	const outlets = useMemo(
		() =>
			sources.sources.filter(source => source.contentType !== 'podcast_episode'),
		[sources.sources]
	);

	/** A soft fade on every new result set; instant when motion is reduced. */
	useEffect(() => {
		if (motion.reduced) {
			fade.setValue(1);
			return;
		}

		fade.setValue(0);
		Animated.timing(fade, {
			toValue: 1,
			duration: motion.duration.base,
			useNativeDriver: true
		}).start();
	}, [fade, motion.reduced, motion.duration.base, search.term, search.state.status]);

	const openItem = (item: ContentItem): void => {
		remember(search.term || query);
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

	const runSuggestion = (term: string): void => {
		setQuery(term);
		remember(term);
	};

	const renderResult = ({ item }: { item: ContentItem }): ReactElement => (
		<Column>
			<StoryRow
				item={item}
				sourceName={sourceIndex.get(item.sourceId)?.name}
				onPress={() => openItem(item)}
			/>
		</Column>
	);

	return (
		<Screen showPlayer>
			<ScreenHeader
				title='Search'
				subtitle='Stories, judgments and episodes'
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
					placeholder='Names, courts, places, cases'
				/>
			</View>

			{isSearching ? (
				<View style={styles.flex}>
					{results.length > 0 ? (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							keyboardShouldPersistTaps='handled'
							contentContainerStyle={{
								paddingHorizontal: gutter,
								paddingBottom: spacing.sm,
								gap: spacing.sm
							}}
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
					) : null}

					<Animated.View
						style={{
							flex: 1,
							opacity: fade,
							transform: [
								{
									translateY: fade.interpolate({
										inputRange: [0, 1],
										outputRange: [6, 0]
									})
								}
							]
						}}
					>
						{search.state.status === 'success' && scoped.length > 0 ? (
							<FlashList
								data={scoped}
								keyExtractor={item => item.id}
								renderItem={renderResult}
								estimatedItemSize={104}
								keyboardShouldPersistTaps='handled'
								keyboardDismissMode='on-drag'
								showsVerticalScrollIndicator={false}
								onEndReached={search.loadMore}
								onEndReachedThreshold={0.6}
								ListHeaderComponent={
									<Column>
										<View
											style={{
												paddingHorizontal: gutter,
												paddingBottom: spacing.xs
											}}
										>
											<Text variant='meta' tone='faint'>
												{scoped.length}{' '}
												{scoped.length === 1 ? 'result' : 'results'}
												{search.hasMore ? ' so far' : ''} for “{search.term}”
											</Text>
										</View>
									</Column>
								}
								ListFooterComponent={
									search.isLoadingMore ? (
										<ActivityIndicator
											color={colour.textMuted}
											style={{ paddingVertical: spacing.xl }}
										/>
									) : (
										<View style={{ height: spacing.xxl }} />
									)
								}
							/>
						) : search.state.status === 'error' ? (
							<Column>
								<ErrorState
									message={search.state.error}
									onRetry={search.reload}
								/>
							</Column>
						) : search.state.status === 'success' ? (
							<Column>
								<EmptyState
									icon={
										<MagnifyingGlassIcon size={32} color={colour.textMuted} />
									}
									title={`No results for “${search.term}”`}
									message={
										results.length > 0
											? 'Nothing in this filter matches. Try All.'
											: 'Check the spelling, or try a name, a court or a place.'
									}
									action={
										results.length > 0 ? (
											<Button
												label='Show all results'
												variant='secondary'
												fullWidth={false}
												onPress={() => setScope('all')}
											/>
										) : (
											<Button
												label='Clear search'
												variant='secondary'
												fullWidth={false}
												onPress={() => setQuery('')}
											/>
										)
									}
								/>
							</Column>
						) : (
							<View style={{ paddingTop: spacing.lg }}>
								<ListSkeleton rows={5} />
							</View>
						)}
					</Animated.View>
				</View>
			) : (
				<ScrollView
					keyboardShouldPersistTaps='handled'
					keyboardDismissMode='on-drag'
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: spacing.xxxl }}
				>
					{query.trim().length > 0 ? (
						<Column>
							<View style={{ paddingHorizontal: gutter, paddingVertical: spacing.sm }}>
								<Text variant='small' tone='muted'>
									{`Type at least ${MIN_QUERY_LENGTH} letters to search.`}
								</Text>
							</View>
						</Column>
					) : null}

					{terms.length > 0 ? (
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
									borderRadius: 12,
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
											<Text variant='body' numberOfLines={1} style={styles.flex}>
												{term}
											</Text>
										</Pressable>
										<IconButton
											label={`Remove ${term} from recent searches`}
											onPress={() => removeTerm(term)}
											icon={<XIcon size={16} color={colour.textMuted} />}
										/>
									</View>
								))}
							</View>
						</Column>
					) : null}

					<Column>
						<View style={{ paddingHorizontal: gutter, paddingTop: spacing.xl }}>
							<Text variant='label' tone='faint'>
								Try searching for
							</Text>
						</View>
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
					</Column>

					<Column>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'baseline',
								justifyContent: 'space-between',
								paddingHorizontal: gutter,
								paddingTop: spacing.xl,
								paddingBottom: spacing.sm
							}}
						>
							<Text variant='h4'>Browse outlets</Text>
							{outlets.length > 0 ? (
								<Text variant='meta' tone='faint'>
									{outlets.length} outlets
								</Text>
							) : null}
						</View>

						{outlets.length > 0 ? (
							outlets.map(source => (
								<SourceRow
									key={source.id}
									source={source}
									onPress={() => openSource(source)}
								/>
							))
						) : sources.status === 'error' ? (
							<ErrorState
								message={sources.error ?? ''}
								onRetry={sources.reload}
							/>
						) : sources.status === 'success' ? (
							<EmptyState
								title='No outlets yet'
								message='Outlets appear here once their feeds have been collected.'
							/>
						) : (
							<ListSkeleton rows={3} />
						)}
					</Column>
				</ScrollView>
			)}
		</Screen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	recentTerm: {
		flex: 1,
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center'
	}
});
