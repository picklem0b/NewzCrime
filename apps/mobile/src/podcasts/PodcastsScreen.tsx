import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MicrophoneIcon, WarningCircleIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import ShowTile from '@/components/podcast/ShowTile';
import Column from '@/components/ui/Column';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { usePodcastShows, useShowEpisodes } from '@/hooks/usePodcasts';
import { useTheme } from '@/hooks/useTheme';

export default function PodcastsScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacing } = useTheme();
	const { gutter } = useLayout();
	const { state: shows, reload: reloadShows } = usePodcastShows();
	const { error: playbackError } = usePlayer();
	const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const showList = shows.status === 'success' ? shows.data : [];
	const activeShowId = selectedShowId ?? showList[0]?.id ?? null;
	const activeShow = showList.find(show => show.id === activeShowId);
	const { state: episodes, reload: reloadEpisodes } =
		useShowEpisodes(activeShowId);

	useEffect(() => {
		if (shows.status !== 'loading') setIsRefreshing(false);
	}, [shows.status]);

	const refresh = (): void => {
		setIsRefreshing(true);
		reloadShows();
		reloadEpisodes();
	};

	const openEpisode = (episode: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: episode.id }
		});

	const items = episodes.status === 'success' ? episodes.data.items : [];
	const queue = items.filter(episode => episode.audioUrl);

	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: spacing.xxxl }}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={refresh}
						tintColor={colour.textMuted}
						colors={[colour.accent]}
					/>
				}
			>
				<Column>
					<ScreenHeader
						title='Podcasts'
						subtitle='Crime and court shows'
						large
					/>

					{playbackError ? (
						<View
							accessible
							accessibilityRole='alert'
							style={[
								styles.notice,
								{
									marginHorizontal: gutter,
									borderColor: colour.border,
									backgroundColor: colour.surface,
									padding: spacing.md,
									gap: spacing.sm
								}
							]}
						>
							<WarningCircleIcon
								size={18}
								color={colour.warning}
							/>
							<Text variant='small' tone='muted'>
								{playbackError}
							</Text>
						</View>
					) : null}

					{shows.status === 'loading' || shows.status === 'idle' ? (
						<ListSkeleton rows={4} />
					) : null}

					{shows.status === 'error' ? (
						<ErrorState
							message={shows.error}
							onRetry={reloadShows}
						/>
					) : null}

					{shows.status === 'success' && showList.length === 0 ? (
						<EmptyState
							icon={
								<MicrophoneIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='No shows yet'
							message='Shows appear here once their feeds have been collected. Pull down to check again.'
						/>
					) : null}

					{showList.length > 0 ? (
						<>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									paddingHorizontal: gutter - 3,
									paddingVertical: spacing.sm,
									gap: spacing.sm
								}}
							>
								{showList.map(show => (
									<ShowTile
										key={show.id}
										show={show}
										selected={show.id === activeShowId}
										onPress={() =>
											setSelectedShowId(show.id)
										}
									/>
								))}
							</ScrollView>

							<SectionHeader
								title={
									activeShow
										? `Latest from ${activeShow.name}`
										: 'Latest episodes'
								}
							/>
						</>
					) : null}

					{episodes.status === 'loading' ? (
						<View style={{ paddingTop: spacing.lg }}>
							<ListSkeleton rows={3} />
						</View>
					) : null}

					{episodes.status === 'error' ? (
						<ErrorState
							message={episodes.error}
							onRetry={reloadEpisodes}
						/>
					) : null}

					{episodes.status === 'success' && items.length === 0 ? (
						<EmptyState
							icon={
								<MicrophoneIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='No episodes yet'
							message='This show has not published anything we could read. Try another show.'
						/>
					) : null}

					{items.map(episode => (
						<EpisodeRow
							key={episode.id}
							episode={episode}
							showName={activeShow?.name}
							artworkUri={activeShow?.logoUrl}
							queue={queue}
							onPress={() => openEpisode(episode)}
						/>
					))}
				</Column>
			</ScrollView>
		</TabScreen>
	);
}

const styles = StyleSheet.create({
	notice: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 12
	}
});
