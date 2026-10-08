import { FlashList } from '@shopify/flash-list';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { NewspaperIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
	ActivityIndicator,
	RefreshControl,
	StyleSheet,
	View
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import LeadStory from '@/components/feed/LeadStory';
import StoryRow from '@/components/feed/StoryRow';
import TopicBar from '@/components/feed/TopicBar';
import TabScreen from '@/components/layout/TabScreen';
import Button from '@/components/ui/Button';
import Column from '@/components/ui/Column';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import { buildFeedEntries } from '@/feed/layout';
import { useFeed } from '@/hooks/useFeed';
import { useLayout } from '@/hooks/useLayout';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import type { FeedEntry } from '@/types';

type HomeRow =
	| { kind: 'topics'; key: string }
	| { kind: 'notice'; key: string }
	| { kind: 'status'; key: string }
	| FeedEntry;

export default function HomeScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();
	const [topic, setTopic] = useState<Topic>('all');
	const listRef = useRef<FlashList<HomeRow>>(null);

	const feed = useFeed({ topic });
	const sourceIndex = useSourceIndex();

	useEffect(() => {
		listRef.current?.scrollToOffset({ offset: 0, animated: false });
	}, [topic]);

	const openItem = (item: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});

	const rows = useMemo<HomeRow[]>(() => {
		const result: HomeRow[] = [{ kind: 'topics', key: 'topics' }];
		if (feed.refreshFailed) result.push({ kind: 'notice', key: 'notice' });

		if (feed.state.status === 'success' && feed.items.length > 0) {
			result.push(...buildFeedEntries(feed.items, topic));
		} else {
			result.push({ kind: 'status', key: 'status' });
		}
		return result;
	}, [feed.items, feed.refreshFailed, feed.state.status, topic]);

	const renderRow = ({ item: row }: { item: HomeRow }): ReactElement => {
		switch (row.kind) {
			case 'topics':
				return <TopicBar value={topic} onChange={setTopic} />;

			case 'notice':
				return (
					<Column>
						<View
							accessibilityRole='alert'
							style={[
								styles.notice,
								{
									marginHorizontal: gutter,
									marginTop: spacing.md,
									paddingLeft: spacing.lg,
									paddingVertical: spacing.xs,
									backgroundColor: colour.surface,
									borderColor: colour.border
								}
							]}
						>
							<Text
								variant='small'
								tone='muted'
								style={styles.noticeText}
							>
								Couldn&apos;t refresh. Showing earlier stories.
							</Text>
							<Button
								label='Retry'
								variant='quiet'
								fullWidth={false}
								onPress={feed.refresh}
							/>
						</View>
					</Column>
				);

			case 'status':
				return (
					<Column>
						{feed.state.status === 'error' ? (
							<ErrorState
								message={feed.state.error}
								onRetry={feed.refresh}
							/>
						) : feed.state.status === 'success' ? (
							<EmptyState
								icon={
									<NewspaperIcon
										size={32}
										color={colour.textMuted}
									/>
								}
								title='No stories here yet'
								message={
									topic === 'all'
										? 'Nothing has been published in the last while. Pull down to check again.'
										: 'No recent stories match this topic. Try Top, or pull down to refresh.'
								}
								action={
									topic === 'all' ? undefined : (
										<Button
											label='Show top stories'
											variant='secondary'
											fullWidth={false}
											onPress={() => setTopic('all')}
										/>
									)
								}
							/>
						) : (
							<View style={{ paddingTop: spacing.md }}>
								<ListSkeleton lead rows={4} />
							</View>
						)}
					</Column>
				);

			case 'section':
				return (
					<Column>
						<SectionHeader title={row.label} />
					</Column>
				);

			case 'lead':
				return (
					<Column>
						<LeadStory
							item={row.item}
							sourceName={
								sourceIndex.get(row.item.sourceId)?.name
							}
							onPress={() => openItem(row.item)}
						/>
					</Column>
				);

			case 'story':
			case 'compact':
				return (
					<Column>
						<StoryRow
							item={row.item}
							compact={row.kind === 'compact'}
							sourceName={
								sourceIndex.get(row.item.sourceId)?.name
							}
							onPress={() => openItem(row.item)}
						/>
					</Column>
				);
		}
	};

	return (
		<TabScreen>
			<FlashList
				ref={listRef}
				data={rows}
				keyExtractor={row => row.key}
				getItemType={row => row.kind}
				renderItem={renderRow}
				estimatedItemSize={132}
				stickyHeaderIndices={[0]}
				showsVerticalScrollIndicator={false}
				ListFooterComponent={
					feed.isLoadingMore ? (
						<ActivityIndicator
							color={colour.textMuted}
							style={{ paddingVertical: spacing.xl }}
						/>
					) : feed.items.length > 0 && !feed.hasMore ? (
						<View
							style={{
								paddingVertical: spacing.xxl,
								alignItems: 'center'
							}}
						>
							<Text variant='meta' tone='faint'>
								You&apos;re up to date
							</Text>
						</View>
					) : (
						<View style={{ height: spacing.xxl }} />
					)
				}
				onEndReached={feed.loadMore}
				onEndReachedThreshold={0.6}
				refreshControl={
					<RefreshControl
						refreshing={feed.isRefreshing}
						onRefresh={feed.refresh}
						tintColor={colour.textMuted}
						colors={[colour.accent]}
					/>
				}
			/>
		</TabScreen>
	);
}

const styles = StyleSheet.create({
	notice: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 12
	},
	noticeText: { flex: 1 }
});
