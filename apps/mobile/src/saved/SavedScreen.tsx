import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { BookmarkSimpleIcon } from 'phosphor-react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import StoryRow from '@/components/feed/StoryRow';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Column from '@/components/ui/Column';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useSaved } from '@/hooks/useSaved';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

type LibraryScope = 'all' | 'stories' | 'episodes';

const scopes: readonly { id: LibraryScope; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'stories', label: 'Stories' },
	{ id: 'episodes', label: 'Episodes' }
];

export default function SavedScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();
	const { items } = useSaved();
	const sourceIndex = useSourceIndex();
	const [scope, setScope] = useState<LibraryScope>('all');

	const isEpisode = (item: ContentItem) => Boolean(item.audioUrl);
	const visible = items.filter(item =>
		scope === 'all'
			? true
			: scope === 'episodes'
				? isEpisode(item)
				: !isEpisode(item)
	);
	const queue = items.filter(isEpisode);

	const openItem = (item: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});

	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: spacing.xxxl }}
			>
				<Column>
					<ScreenHeader
						title='Library'
						subtitle={
							items.length > 0
								? `${items.length} saved ${items.length === 1 ? 'item' : 'items'}`
								: undefined
						}
						large
					/>

					{items.length === 0 ? (
						<EmptyState
							icon={
								<BookmarkSimpleIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='Nothing saved yet'
							message='Tap the bookmark on a story or episode to keep it here. Saved items stay available offline.'
							action={
								<Button
									label='Browse today’s stories'
									variant='secondary'
									fullWidth={false}
									onPress={() =>
										router.navigate('/tabs/Home')
									}
								/>
							}
						/>
					) : (
						<>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
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

							{visible.length === 0 ? (
								<EmptyState
									title={
										scope === 'episodes'
											? 'No saved episodes'
											: 'No saved stories'
									}
									message='Switch to All to see everything you have saved.'
								/>
							) : (
								visible.map(item =>
									isEpisode(item) ? (
										<EpisodeRow
											key={item.id}
											episode={item}
											showName={
												sourceIndex.get(item.sourceId)
													?.name
											}
											artworkUri={
												sourceIndex.get(item.sourceId)
													?.logoUrl
											}
											queue={queue}
											onPress={() => openItem(item)}
										/>
									) : (
										<StoryRow
											key={item.id}
											item={item}
											sourceName={
												sourceIndex.get(item.sourceId)
													?.name
											}
											onPress={() => openItem(item)}
										/>
									)
								)
							)}

							<View
								style={{
									paddingHorizontal: gutter,
									paddingTop: spacing.lg
								}}
							>
								<Text variant='meta' tone='faint'>
									Saved on this device.
								</Text>
							</View>
						</>
					)}
				</Column>
			</ScrollView>
		</TabScreen>
	);
}
