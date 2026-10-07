import type { ContentItem } from '@newzcrime/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowSquareOutIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import StoryRow from '@/components/feed/StoryRow';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import Column from '@/components/ui/Column';
import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useSource, useSourceItems } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { openExternalUrl } from '@/utils/external';

export default function SourceDetailScreen(): ReactElement {
	const { sourceId } = useLocalSearchParams<{ sourceId?: string }>();
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();

	const { state: source, reload: reloadSource } = useSource(sourceId ?? '');
	const { state: items, reload: reloadItems } = useSourceItems(
		sourceId ?? ''
	);

	const sourceData = source.status === 'success' ? source.data : null;
	const isPodcast = sourceData?.contentType === 'podcast_episode';
	const list = items.status === 'success' ? items.data.items : [];
	const playable = list.filter(item => item.audioUrl);

	const openItem = (item: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});

	const goBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		router.replace('/tabs/Home');
	};

	return (
		<Screen showPlayer>
			<ScreenHeader
				title={sourceData?.name ?? 'Source'}
				onBack={goBack}
				actions={
					sourceData?.siteUrl ? (
						<IconButton
							label={`Open ${sourceData.name} website`}
							onPress={() => {
								void openExternalUrl(sourceData.siteUrl ?? '');
							}}
							icon={
								<ArrowSquareOutIcon
									size={22}
									color={colour.text}
								/>
							}
						/>
					) : undefined
				}
			/>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: spacing.xxxl }}
			>
				<Column>
					{sourceData?.description ? (
						<View
							style={{
								paddingHorizontal: gutter,
								paddingBottom: spacing.md
							}}
						>
							<Text variant='small' tone='muted'>
								{sourceData.description}
							</Text>
						</View>
					) : null}

					{items.status === 'loading' || items.status === 'idle' ? (
						<ListSkeleton rows={5} />
					) : null}

					{source.status === 'error' ? (
						<ErrorState
							message={source.error}
							onRetry={reloadSource}
						/>
					) : null}

					{source.status !== 'error' && items.status === 'error' ? (
						<ErrorState
							message={items.error}
							onRetry={reloadItems}
						/>
					) : null}

					{items.status === 'success' && list.length === 0 ? (
						<EmptyState
							title='Nothing collected yet'
							message='No items have been collected from this source recently. Check back soon.'
						/>
					) : null}

					{list.map(item =>
						isPodcast ? (
							<EpisodeRow
								key={item.id}
								episode={item}
								showName={sourceData?.name}
								artworkUri={sourceData?.logoUrl}
								queue={playable}
								onPress={() => openItem(item)}
							/>
						) : (
							<StoryRow
								key={item.id}
								item={item}
								sourceName={sourceData?.name}
								onPress={() => openItem(item)}
							/>
						)
					)}

					{items.status === 'success' && items.data.nextCursor ? (
						<View
							style={{
								paddingHorizontal: gutter,
								paddingTop: spacing.lg
							}}
						>
							<Text variant='meta' tone='faint'>
								Showing the {list.length} most recent items.
							</Text>
						</View>
					) : null}
				</Column>
			</ScrollView>
		</Screen>
	);
}
