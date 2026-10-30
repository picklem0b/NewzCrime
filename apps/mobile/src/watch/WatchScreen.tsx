import type { ContentItem, Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { PlayCircleIcon, WarningCircleIcon } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import Column from '@/components/ui/Column';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import ChannelTile from '@/components/watch/ChannelTile';
import HeroVideo from '@/components/watch/HeroVideo';
import VideoCard from '@/components/watch/VideoCard';
import WatchCategoryBar from '@/components/watch/WatchCategoryBar';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useLayout } from '@/hooks/useLayout';
import { usePlayer } from '@/hooks/usePlayer';
import { useSetting } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useVideoChannels, useVideoFeed } from '@/hooks/useVideos';
import { useFollowingStore } from '@/stores/following.store';
import type { WatchCategory } from '@/types';
import {
  WATCH_RAILS,
  filterVideos,
  isLiveVideo,
  localFirst,
  provinceLabel
} from '@/utils/watch';
import type { VideoEntry } from '@/utils/watch';

interface Rail {
  key: string;
  title: string;
  entries: VideoEntry[];
}

const railLabel = (category: WatchCategory): string =>
  WATCH_RAILS.find((rail) => rail.id === category)?.label ?? 'Latest';

/**
 * Watch.
 *
 * A curated video shelf rather than a second chronological feed: a lead story,
 * a live rail, and distinct shelves for true crime and courts. The category
 * chips are filters, not decorative labels, so every shelf can be opened on
 * its own. Nothing autoplays, and the channel rail is drawn from every channel
 * even if its newest video is older than the page.
 */
export default function WatchScreen(): ReactElement {
  const router = useRouter();
  const { colour, spacing } = useTheme();
  const { gutter } = useLayout();
  const { error: playbackError } = usePlayer();
  const startTab = useSetting('watchStartTab');
  const province = useSetting('province');
  const putLocalFirst = useSetting('localFirst');
  const autoRefresh = useSetting('autoRefresh');
  const refreshInterval = useSetting('refreshInterval');
  const followingIds = useFollowingStore((state) => state.sourceIds);

  const [category, setCategory] = useState<WatchCategory>(startTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const channels = useVideoChannels();
  const videos = useVideoFeed();
  useAutoRefresh(videos.reload, autoRefresh, refreshInterval);

  useEffect(() => {
    setCategory(startTab);
  }, [startTab]);

  useEffect(() => {
    if (videos.state.status !== 'loading') setIsRefreshing(false);
  }, [videos.state.status]);

  const sourceIndex = useMemo(() => {
    const index = new Map<string, Source>();
    for (const channel of channels.state.status === 'success'
      ? channels.state.data
      : []) {
      index.set(channel.id, channel);
    }
    return index;
  }, [channels.state]);

  const entries = useMemo<VideoEntry[]>(() => {
    const items = videos.state.status === 'success' ? videos.state.data.items : [];
    return items.map((item) => ({
      item,
      source: sourceIndex.get(item.sourceId)
    }));
  }, [sourceIndex, videos.state]);

  const ordered = useMemo(
    () => localFirst(entries, province, putLocalFirst),
    [entries, province, putLocalFirst]
  );

  const followingSet = useMemo(
    () => new Set(followingIds),
    [followingIds]
  );

  const followed = useMemo(
    () => ordered.filter((entry) => followingSet.has(entry.item.sourceId)),
    [followingSet, ordered]
  );

  const filtered = useMemo(
    () => filterVideos(ordered, category, province),
    [ordered, category, province]
  );

  const hero = filtered[0] ?? null;

  const live = useMemo(
    () => ordered.filter((entry) => isLiveVideo(entry.item)).slice(0, 10),
    [ordered]
  );

  const rails = useMemo<Rail[]>(() => {
    if (category !== 'for_you') {
      return [
        {
          key: `all-${category}`,
          title: `Latest in ${railLabel(category)}`,
          entries: filtered
        }
      ];
    }

    const withoutHero = (list: VideoEntry[]): VideoEntry[] =>
      hero ? list.filter((entry) => entry.item.id !== hero.item.id) : list;

    return [
      {
        key: 'following',
        title: 'From channels you follow',
        entries: withoutHero(followed).slice(0, 12)
      },
      {
        key: 'live',
        title: 'Live now',
        entries: withoutHero(live)
      },
      {
        key: 'true-crime',
        title: 'True crime files',
        entries: withoutHero(
          filterVideos(ordered, 'true_crime', province)
        ).slice(0, 12)
      },
      {
        key: 'courts',
        title: 'Courts & commissions',
        entries: withoutHero(
          filterVideos(ordered, 'courts', province)
        ).slice(0, 12)
      },
      {
        key: 'local',
        title: `Local · ${provinceLabel(province)}`,
        entries: withoutHero(
          filterVideos(ordered, 'local', province)
        ).slice(0, 12)
      },
      {
        key: 'news',
        title: 'News & briefings',
        entries: withoutHero(
          filterVideos(ordered, 'news', province)
        ).slice(0, 12)
      }
    ].filter((rail) => rail.entries.length > 0);
  }, [category, filtered, followed, hero, live, ordered, province]);

  const channelList =
    channels.state.status === 'success' ? channels.state.data : [];

  const latestForChannel = useMemo(() => {
    const map = new Map<string, ContentItem>();
    for (const entry of ordered) {
      if (!map.has(entry.item.sourceId)) map.set(entry.item.sourceId, entry.item);
    }
    return map;
  }, [ordered]);

  const openVideo = (item: ContentItem): void => {
    router.push({
      pathname: '/watch/VideoDetail',
      params: { itemId: item.id, sourceId: item.sourceId }
    });
  };

  const openChannel = (channel: Source): void => {
    const latest = latestForChannel.get(channel.id);
    if (latest) {
      router.push({
        pathname: '/watch/VideoDetail',
        params: { itemId: latest.id, sourceId: channel.id }
      });
      return;
    }

    router.push({
      pathname: '/detail/SourceDetail',
      params: { sourceId: channel.id }
    });
  };

  const refresh = (): void => {
    setIsRefreshing(true);
    videos.reload();
    channels.reload();
  };

  const isLoading =
    videos.state.status === 'loading' || videos.state.status === 'idle';

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
        <Column max={960}>
          <ScreenHeader
            title='Watch'
            subtitle='Live courts, true crime and local updates'
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
              <WarningCircleIcon size={18} color={colour.warning} />
              <Text variant='small' tone='muted'>
                {playbackError}
              </Text>
            </View>
          ) : null}

          <WatchCategoryBar
            value={category}
            province={province}
            onChange={setCategory}
          />

          {isLoading ? <ListSkeleton rows={4} /> : null}

          {videos.state.status === 'error' ? (
            <ErrorState message={videos.state.error} onRetry={videos.reload} />
          ) : null}

          {channels.state.status === 'error' && videos.state.status === 'success' ? (
            <ErrorState
              message={channels.state.error}
              onRetry={channels.reload}
            />
          ) : null}

          {videos.state.status === 'success' && filtered.length === 0 ? (
            <EmptyState
              icon={
                <PlayCircleIcon size={32} color={colour.textMuted} />
              }
              title={
                category === 'for_you'
                  ? 'No videos yet'
                  : `Nothing in ${railLabel(category)} yet`
              }
              message={
                category === 'local' && province !== 'all'
                  ? `No recent video mentions ${provinceLabel(province)}. Try All provinces, or pull down to check again.`
                  : 'New uploads appear here after the next collection run. Pull down to check again.'
              }
              action={
                category === 'for_you' ? undefined : (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Text
                      variant='small'
                      tone='accent'
                      onPress={() => setCategory('for_you')}
                      accessibilityRole='button'
                    >
                      Show all videos
                    </Text>
                  </View>
                )
              }
            />
          ) : null}

          {hero ? (
            <View style={{ paddingHorizontal: gutter, paddingTop: spacing.sm }}>
              <HeroVideo
                item={hero.item}
                sourceName={hero.source?.name}
                railLabel={railLabel(category)}
                onPress={() => openVideo(hero.item)}
              />
            </View>
          ) : null}

          {hero && category !== 'for_you' ? (
            <Text
              variant='meta'
              tone='faint'
              style={{ paddingHorizontal: gutter, paddingTop: spacing.sm }}
            >
              {filtered.length} {filtered.length === 1 ? 'video' : 'videos'} in{' '}
              {railLabel(category)}. Tap a card to open the player and its
              playlist.
            </Text>
          ) : null}

          {rails.map((rail) => (
            <View key={rail.key}>
              <SectionHeader title={rail.title} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: gutter,
                  paddingTop: spacing.sm,
                  paddingBottom: spacing.xs,
                  gap: spacing.md
                }}
              >
                {rail.entries.map((entry) => (
                  <VideoCard
                    key={entry.item.id}
                    item={entry.item}
                    sourceName={entry.source?.name}
                    onPress={() => openVideo(entry.item)}
                  />
                ))}
              </ScrollView>
            </View>
          ))}

          {channelList.length > 0 ? (
            <View>
              <SectionHeader title='Channels worth following' />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: gutter,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.xs,
                  gap: spacing.md
                }}
              >
                {channelList.map((channel) => (
                  <ChannelTile
                    key={channel.id}
                    channel={channel}
                    artwork={latestForChannel.get(channel.id)?.imageUrl}
                    onPress={() => openChannel(channel)}
                  />
                ))}
              </ScrollView>
              <Text
                variant='meta'
                tone='faint'
                style={{
                  paddingHorizontal: gutter,
                  paddingTop: spacing.md
                }}
              >
                Video is streamed by YouTube. NewzCrime collects the public
                channel feed and plays it in the app; it does not host or
                re-upload anything.
              </Text>
            </View>
          ) : null}
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
