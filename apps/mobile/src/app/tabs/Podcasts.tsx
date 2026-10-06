import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MicrophoneIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View
} from 'react-native';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import ShowCard from '@/components/podcast/ShowCard';
import { usePodcastShows, useShowEpisodes } from '@/hooks/usePodcasts';
import { useTheme } from '@/hooks/useTheme';
export default function PodcastsScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacingX, spacingY, tabBar } = useTheme();
	const { state: shows, reload: reloadShows } = usePodcastShows();
	const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
	const [refreshing, setRefreshing] = useState(false);
	const showList = shows.status === 'success' ? shows.data : [];
	const activeShowId = selectedShowId ?? showList[0]?.id ?? null;
	const { state: episodes, reload: reloadEpisodes } =
		useShowEpisodes(activeShowId);
	useEffect(() => {
		if (shows.status !== 'loading') setRefreshing(false);
	}, [shows.status]);
	const queue =
		episodes.status === 'success'
			? episodes.data.items.filter(episode => episode.audioUrl)
			: [];
	const openPlayer = (episode: ContentItem) =>
		router.push({
			pathname: '/player/Player',
			params: { itemId: episode.id }
		});
	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: tabBar.clearance }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => {
							setRefreshing(true);
							reloadShows();
						}}
						tintColor={colour.textMuted}
					/>
				}
			>
				<ScreenHeader
					eyebrow='Listen deeper'
					title='Podcasts'
					subtitle='Crime and true-life conversations'
				/>
				{shows.status === 'loading' ? <ListSkeleton rows={3} /> : null}
				{shows.status === 'error' ? (
					<ErrorState message={shows.error} onRetry={reloadShows} />
				) : null}
				{showList.length > 0 ? (
					<>
						<Text
							style={[
								styles.kicker,
								{
									color: colour.textFaint,
									paddingHorizontal: spacingX.lg
								}
							]}
						>
							Shows
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: spacingX.lg,
								paddingTop: spacingY.md,
								paddingBottom: spacingY.xl,
								gap: spacingX.md
							}}
						>
							{showList.map(show => (
								<View key={show.id} style={{ width: 280 }}>
									<ShowCard
										show={show}
										onPress={() =>
											setSelectedShowId(show.id)
										}
									/>
								</View>
							))}
						</ScrollView>
						<Text
							style={[
								styles.kicker,
								{
									color: colour.textFaint,
									paddingHorizontal: spacingX.lg,
									paddingBottom: spacingY.sm
								}
							]}
						>
							Latest episodes
						</Text>
					</>
				) : null}
				{shows.status === 'success' && showList.length === 0 ? (
					<EmptyState
						icon={
							<MicrophoneIcon
								size={36}
								color={colour.textFaint}
								weight='duotone'
							/>
						}
						title='No shows yet'
						message='Podcast shows appear here once the worker ingests their feeds.'
					/>
				) : null}
				{episodes.status === 'loading' ? (
					<ListSkeleton rows={3} />
				) : null}
				{episodes.status === 'error' ? (
					<ErrorState
						message={episodes.error}
						onRetry={reloadEpisodes}
					/>
				) : null}
				{episodes.status === 'success' &&
				episodes.data.items.length === 0 ? (
					<EmptyState
						icon={
							<MicrophoneIcon
								size={36}
								color={colour.textFaint}
								weight='duotone'
							/>
						}
						title='No episodes yet'
						message='This show has not published anything the worker could read.'
					/>
				) : null}
				{episodes.status === 'success'
					? episodes.data.items.map(episode => (
							<EpisodeRow
								key={episode.id}
								episode={episode}
								queue={queue}
								onPress={() => openPlayer(episode)}
							/>
						))
					: null}
			</ScrollView>
		</TabScreen>
	);
}
const styles = StyleSheet.create({
	kicker: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1.1,
		textTransform: 'uppercase'
	}
});
