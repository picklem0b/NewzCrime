import type { ContentItem, Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
 */
export default function PodcastsScreen(): ReactElement {
  const router = useRouter();
  const { colour, spacingX, spacingY, typography } = useTheme();
  const shows = usePodcastShows();
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);

  const activeShowId =
    selectedShowId ??
    (shows.status === 'success' ? (shows.data[0]?.id ?? null) : null);

  const episodes = useShowEpisodes(activeShowId ?? '');

  const openPlayer = (episode: ContentItem) =>
    router.push({ pathname: '/player/Player', params: { itemId: episode.id } });

  const queue =
    episodes.status === 'success'
      ? episodes.data.items.filter((episode) => episode.audioUrl)
      : [];

  if (shows.status === 'loading' || shows.status === 'idle') {
    return (
      <TabScreen>
        <ScreenHeader title='Podcasts' subtitle='Crime and true-life shows' />
        <ListSkeleton rows={4} />
      </TabScreen>
    );
  }

  if (shows.status === 'error') {
    return (
      <TabScreen>
        <ScreenHeader title='Podcasts' subtitle='Crime and true-life shows' />
        <ErrorState message={shows.error} />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacingY.xxxl }}
      >
        <ScreenHeader title='Podcasts' subtitle='Crime and true-life shows' />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacingX.lg,
            paddingBottom: spacingY.lg,
            gap: spacingX.md,
          }}
        >
          {shows.data.map((show: Source) => (
            <View key={show.id} style={styles.showCard}>
              <ShowCard
                show={show}
                onPress={() => setSelectedShowId(show.id)}
              />
            </View>
          ))}
        </ScrollView>

        {shows.data.length === 0 ? (
          <EmptyState
            title='No shows yet'
            message='Podcast shows appear here once the worker ingests their feeds.'
          />
        ) : null}

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

        {episodes.status === 'loading' ? <ListSkeleton rows={3} /> : null}

        {episodes.status === 'error' ? (
          <ErrorState message={episodes.error} />
        ) : null}

        {episodes.status === 'success' && episodes.data.items.length === 0 ? (
          <EmptyState
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
