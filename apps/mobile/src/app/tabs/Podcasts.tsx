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
  View,
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

/**
 * Podcasts: the curated shows, and the latest episodes of the selected one.
 *
 * Episodes play through the shared player, which queues the rest of the show
 * behind whichever episode was tapped.
 *
 * States render in place rather than replacing the screen, so a pull-to-refresh
 * keeps the list mounted and its spinner has somewhere to show.
 */
export default function PodcastsScreen(): ReactElement {
  const router = useRouter();
  const { colour, spacingX, spacingY, typography } = useTheme();
  const { state: shows, reload: reloadShows } = usePodcastShows();
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showList = shows.status === 'success' ? shows.data : [];
  const activeShowId = selectedShowId ?? showList[0]?.id ?? null;
  const { state: episodes, reload: reloadEpisodes } =
    useShowEpisodes(activeShowId);

  useEffect(() => {
    if (shows.status !== 'loading') setIsRefreshing(false);
  }, [shows.status]);

  const refresh = (): void => {
    setIsRefreshing(true);
    reloadShows();
  };

  const openPlayer = (episode: ContentItem) =>
    router.push({ pathname: '/player/Player', params: { itemId: episode.id } });

  const queue =
    episodes.status === 'success'
      ? episodes.data.items.filter((episode) => episode.audioUrl)
      : [];

  return (
    <TabScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacingY.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colour.textMuted}
          />
        }
      >
        <ScreenHeader title='Podcasts' subtitle='Crime and true-life shows' />

        {shows.status === 'loading' ? <ListSkeleton rows={4} /> : null}

        {shows.status === 'error' ? (
          <ErrorState message={shows.error} onRetry={reloadShows} />
        ) : null}

        {showList.length > 0 ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacingX.lg,
                paddingBottom: spacingY.lg,
                gap: spacingX.md,
              }}
            >
              {showList.map((show) => (
                <View key={show.id} style={styles.showCard}>
                  <ShowCard
                    show={show}
                    onPress={() => setSelectedShowId(show.id)}
                  />
                </View>
              ))}
            </ScrollView>

            <Text
              style={{
                color: colour.textFaint,
                fontSize: typography.size.caption,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                paddingHorizontal: spacingX.lg,
                paddingBottom: spacingY.sm,
              }}
            >
              Latest episodes
            </Text>
          </>
        ) : null}

        {shows.status === 'success' && showList.length === 0 ? (
          <EmptyState
            icon={
              <MicrophoneIcon size={36} color={colour.textFaint} weight='duotone' />
            }
            title='No shows yet'
            message='Podcast shows appear here once the worker ingests their feeds.'
          />
        ) : null}

        {episodes.status === 'loading' ? <ListSkeleton rows={3} /> : null}

        {episodes.status === 'error' ? (
          <ErrorState message={episodes.error} onRetry={reloadEpisodes} />
        ) : null}

        {episodes.status === 'success' && episodes.data.items.length === 0 ? (
          <EmptyState
            icon={
              <MicrophoneIcon size={36} color={colour.textFaint} weight='duotone' />
            }
            title='No episodes yet'
            message='This show has not published anything the worker could read.'
          />
        ) : null}

        {episodes.status === 'success'
          ? episodes.data.items.map((episode) => (
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
  showCard: { width: 280 },
});
