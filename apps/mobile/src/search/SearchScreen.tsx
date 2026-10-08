import { FlashList } from '@shopify/flash-list';
import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import {
	ClockCounterClockwiseIcon,
	MagnifyingGlassIcon,
	XIcon
} from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
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
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import SourceRow from '@/components/source/SourceRow';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Column from '@/components/ui/Column';
import IconButton from '@/components/ui/IconButton';
import SearchField from '@/components/ui/SearchField';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import { MIN_QUERY_LENGTH, useSearch } from '@/hooks/useSearch';
import { useLayout } from '@/hooks/useLayout';
import { useSources, useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { useRecentSearchesStore } from '@/stores/search.store';
import type { SearchScope } from '@/types';

type SearchRow =
	| { kind: 'recentHeader'; key: string }
	| { kind: 'recent'; key: string; term: string }
	| { kind: 'sourcesHeader'; key: string }
	| { kind: 'source'; key: string; sourceId: string }
	| { kind: 'sourcesStatus'; key: string }
	| { kind: 'count'; key: string; total: number }
	| { kind: 'result'; key: string; item: ContentItem }
	| { kind: 'status'; key: string };

const scopes: readonly { id: SearchScope; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'stories', label: 'Stories' },
	{ id: 'judgments', label: 'Judgments' },
	{ id: 'episodes', label: 'Episodes' }
];

const inScope = (item: ContentItem, scope: SearchScope): boolean => {
	if (scope === 'all') return true;
	if (scope === 'judgments') return item.type === 'court_ruling';
	if (scope === 'episodes') return item.type === 'podcast_episode';
	return item.type === 'article';
};

export default function SearchScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();
	const [query, setQuery] = useState('');
	const [scope, setScope] = useState<SearchScope>('all');

	const search = useSearch(query);
	const sourceIndex = useSourceIndex();
	const sources = useSources();
	const terms = useRecentSearchesStore(state => state.terms);
	const addTerm = useRecentSearchesStore(state => state.add);
	const removeTerm = useRecentSearchesStore(state => state.remove);
	const clearTerms = useRecentSearchesStore(state => state.clear);

	const isSearching = query.trim().length >= MIN_QUERY_LENGTH;

	/**
	 * Search is reached from the top bar, so this is usually a step back. The
	 * fallback covers a cold start on Search, which the start-tab setting can
	 * produce, where there is nothing to go back to.
	 */
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
			sources.sources.filter(
				source => source.contentType !== 'podcast_episode'
			),
		[sources.sources]
	);

	const openItem = (item: ContentItem) => {
		addTerm(search.term || query);
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});
	};

	const rows = useMemo<SearchRow[]>(() => {
		if (!isSearching) {
			const list: SearchRow[] = [];
			if (terms.length > 0) {
				list.push({ kind: 'recentHeader', key: 'recent-header' });
				for (const term of terms) {
					list.push({ kind: 'recent', key: `recent:${term}`, term });
				}
			}
			list.push({ kind: 'sourcesHeader', key: 'sources-header' });
			if (outlets.length > 0) {
				for (const source of outlets) {
					list.push({
						kind: 'source',
						key: `source:${source.id}`,
						sourceId: source.id
					});
				}
			} else {
				list.push({ kind: 'sourcesStatus', key: 'sources-status' });
			}
			return list;
		}

		if (search.state.status !== 'success' || scoped.length === 0) {
			return [{ kind: 'status', key: 'status' }];
		}

		return [
			{ kind: 'count', key: 'count', total: scoped.length },
			...scoped.map<SearchRow>(item => ({
				kind: 'result',
				key: `result:${item.id}`,
				item
			}))
		];
	}, [isSearching, terms, outlets, search.state.status, scoped]);

	const renderRow = ({ item: row }: { item: SearchRow }): ReactElement => {
		switch (row.kind) {
			case 'recentHeader':
				return (
					<Column>
						<View
							style={[
								styles.recentHeader,
								{
									paddingHorizontal: gutter,
									paddingTop: spacing.lg
								}
							]}
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
					</Column>
				);

			case 'recent':
				return (
					<Column>
						<View
							style={[
								styles.recent,
								{
									marginHorizontal: gutter,
									borderBottomColor: colour.border
								}
							]}
						>
							<Pressable
								accessibilityRole='button'
								accessibilityLabel={`Search again for ${row.term}`}
								onPress={() => setQuery(row.term)}
								style={({ pressed }) => [
									styles.recentTerm,
									{
										gap: spacing.md,
										backgroundColor: pressed
											? colour.pressed
											: 'transparent'
									}
								]}
							>
								<ClockCounterClockwiseIcon
									size={20}
									color={colour.textMuted}
								/>
								<Text
									variant='body'
									numberOfLines={1}
									style={styles.flex}
								>
									{row.term}
								</Text>
							</Pressable>
							<IconButton
								label={`Remove ${row.term} from recent searches`}
								onPress={() => removeTerm(row.term)}
								icon={
									<XIcon size={16} color={colour.textMuted} />
								}
							/>
						</View>
					</Column>
				);

			case 'sourcesHeader':
				return (
					<Column>
						<SectionHeader title='Browse outlets' />
					</Column>
				);

			case 'source': {
				const source = sourceIndex.get(row.sourceId);
				if (!source) return <View />;
				return (
					<Column>
						<SourceRow
							source={source}
							onPress={() =>
								router.push({
									pathname: '/detail/SourceDetail',
									params: { sourceId: source.id }
								})
							}
						/>
					</Column>
				);
			}

			case 'sourcesStatus':
				return (
					<Column>
						{sources.status === 'error' ? (
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
				);

			case 'count':
				return (
					<Column>
						<View
							style={{
								paddingHorizontal: gutter,
								paddingVertical: spacing.sm
							}}
						>
							<Text variant='meta' tone='faint'>
								{row.total}{' '}
								{row.total === 1 ? 'result' : 'results'}
								{search.hasMore ? ' so far' : ''}
							</Text>
						</View>
					</Column>
				);

			case 'result':
				return (
					<Column>
						<StoryRow
							item={row.item}
							sourceName={
								sourceIndex.get(row.item.sourceId)?.name
							}
							onPress={() => openItem(row.item)}
						/>
					</Column>
				);

			case 'status':
				return (
					<Column>
						{search.state.status === 'error' ? (
							<ErrorState
								message={search.state.error}
								onRetry={search.reload}
							/>
						) : search.state.status === 'success' ? (
							<EmptyState
								icon={
									<MagnifyingGlassIcon
										size={32}
										color={colour.textMuted}
									/>
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
									) : undefined
								}
							/>
						) : (
							<View style={{ paddingTop: spacing.lg }}>
								<ListSkeleton rows={5} />
							</View>
						)}
					</Column>
				);
		}
	};

	return (
		<TabScreen>
			<ScreenHeader title='Search' large onBack={goBack} />

			<Column>
				<View
					style={{
						paddingHorizontal: gutter,
						paddingBottom: spacing.sm
					}}
				>
					<SearchField
						value={query}
						onChangeText={setQuery}
						onSubmit={() => addTerm(query)}
						placeholder='Names, courts, places, cases'
					/>
				</View>

				{isSearching && results.length > 0 ? (
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
			</Column>

			<FlashList
				data={rows}
				keyExtractor={row => row.key}
				getItemType={row => row.kind}
				renderItem={renderRow}
				estimatedItemSize={88}
				keyboardShouldPersistTaps='handled'
				keyboardDismissMode='on-drag'
				showsVerticalScrollIndicator={false}
				onEndReached={isSearching ? search.loadMore : undefined}
				onEndReachedThreshold={0.6}
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
		</TabScreen>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	recentHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	recent: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	recentTerm: {
		flex: 1,
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center'
	}
});
