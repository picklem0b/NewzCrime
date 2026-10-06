import { FlashList } from '@shopify/flash-list';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import {
	BellIcon,
	MagnifyingGlassIcon,
	NewspaperIcon,
	SunIcon
} from 'phosphor-react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	Text,
	View
} from 'react-native';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import HeadlineRow from '@/components/feed/HeadlineRow';
import StoryCard from '@/components/feed/StoryCard';
import TopicChips from '@/components/feed/TopicChips';
import TabScreen from '@/components/layout/TabScreen';
import { useFeed } from '@/hooks/useFeed';
import { useSourceIndex } from '@/hooks/useSources';
import { useStopSpeechOnUnmount } from '@/hooks/useSpeech';
import { useTheme } from '@/hooks/useTheme';
export default function HomeScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacingX, spacingY, tabBar, typography } = useTheme();
	const [topic, setTopic] = useState<Topic>('all');
	const feed = useFeed({ topic });
	const sourceIndex = useSourceIndex();
	useStopSpeechOnUnmount();
	const openItem = (item: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});
	const lead = feed.items[0];
	const rest = feed.items.slice(1);
	return (
		<TabScreen>
			<FlashList
				data={rest}
				keyExtractor={item => item.id}
				estimatedItemSize={128}
				contentContainerStyle={{ paddingBottom: tabBar.clearance }}
				renderItem={({ item }) => (
					<HeadlineRow
						item={item}
						sourceName={sourceIndex.get(item.sourceId)?.name}
						onPress={() => openItem(item)}
					/>
				)}
				ListHeaderComponent={
					<View>
						<View
							style={{
								paddingHorizontal: spacingX.lg,
								paddingTop: spacingY.lg,
								paddingBottom: spacingY.md,
								gap: 6
							}}
						>
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between'
								}}
							>
								<View>
									<Text
										style={{
											color: colour.text,
											fontSize: 34,
											fontWeight: '800',
											letterSpacing: -1.6
										}}
									>
										Newz
										<Text style={{ color: colour.accent }}>
											Crime
										</Text>
									</Text>
									<Text
										style={{
											color: colour.textMuted,
											fontSize: 13,
											letterSpacing: 0.4
										}}
									>
										Real stories. A safer tomorrow.
									</Text>
								</View>
								<View style={{ flexDirection: 'row', gap: 8 }}>
									<Pressable
										accessibilityRole='button'
										accessibilityLabel='Search'
										onPress={() =>
											router.push('/search/Search')
										}
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											backgroundColor: colour.surface,
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										<MagnifyingGlassIcon
											size={20}
											color={colour.text}
										/>
									</Pressable>
									<Pressable
										accessibilityRole='button'
										accessibilityLabel='Notifications'
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											backgroundColor: colour.surface,
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										<BellIcon
											size={20}
											color={colour.textMuted}
										/>
									</Pressable>
								</View>
							</View>
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: 6
								}}
							>
								<SunIcon
									size={15}
									color={colour.accent}
									weight='fill'
								/>
								<Text
									style={{
										color: colour.textFaint,
										fontSize: 12
									}}
								>
									Your daily briefing ·{' '}
									{feed.state.status === 'success'
										? `${feed.items.length} stories`
										: 'Latest updates'}
								</Text>
							</View>
						</View>
						<TopicChips value={topic} onChange={setTopic} />
						{feed.state.status === 'loading' ? (
							<ListSkeleton />
						) : null}
						{feed.state.status === 'error' ? (
							<ErrorState
								message={feed.state.error}
								onRetry={feed.refresh}
							/>
						) : null}
						{feed.state.status === 'success' &&
						feed.items.length === 0 ? (
							<EmptyState
								icon={
									<NewspaperIcon
										size={36}
										color={colour.textFaint}
										weight='duotone'
									/>
								}
								title='Nothing here yet'
								message='No stories match this topic. Try another filter or pull down to refresh.'
							/>
						) : null}
						{lead ? (
							<View
								style={{
									paddingHorizontal: spacingX.lg,
									paddingTop: spacingY.md,
									paddingBottom: spacingY.xl
								}}
							>
								<Text
									style={{
										color: colour.text,
										fontSize: typography.size.title,
										fontWeight: typography.weight.bold,
										letterSpacing: -0.4,
										marginBottom: spacingY.sm
									}}
								>
									Top story
								</Text>
								<StoryCard
									featured
									item={lead}
									sourceName={
										sourceIndex.get(lead.sourceId)?.name
									}
									onPress={() => openItem(lead)}
								/>
							</View>
						) : null}
						{rest.length > 0 ? (
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									paddingHorizontal: spacingX.lg,
									paddingBottom: spacingY.sm
								}}
							>
								<Text
									style={{
										color: colour.text,
										fontSize: typography.size.title,
										fontWeight: typography.weight.bold,
										letterSpacing: -0.4
									}}
								>
									Latest
								</Text>
								<Text
									style={{
										color: colour.accent,
										fontSize: typography.size.small,
										fontWeight: typography.weight.bold
									}}
								>
									See all ›
								</Text>
							</View>
						) : null}
					</View>
				}
				onEndReached={feed.loadMore}
				onEndReachedThreshold={0.6}
				ListFooterComponent={
					feed.isLoadingMore ? (
						<ActivityIndicator
							color={colour.textMuted}
							style={{ paddingVertical: spacingY.xl }}
						/>
					) : null
				}
				refreshControl={
					<RefreshControl
						refreshing={feed.state.status === 'loading'}
						onRefresh={feed.refresh}
						tintColor={colour.textMuted}
					/>
				}
			/>
		</TabScreen>
	);
}
