import type { ContentItem, Source } from '@newzcrime/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretUpIcon,
  ShareNetworkIcon
} from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';

import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import SaveButton from '@/components/feed/SaveButton';
import FollowButton from '@/components/source/FollowButton';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import VideoCard from '@/components/watch/VideoCard';
import VideoRow from '@/components/watch/VideoRow';
import YouTubePlayer from '@/components/youtube/YouTubePlayer';
import { useItem } from '@/hooks/useItem';
import { useLayout } from '@/hooks/useLayout';
import { useSetting } from '@/hooks/useSettings';
import { useSource } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { useChannelVideos, useVideoChannels, useVideoFeed } from '@/hooks/useVideos';
import { openExternalUrl, shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';
import { youtubeVideoId } from '@/utils/youtube';
import {
  descriptionParagraphs,
  formatViewCount,
  isLiveVideo,
  provinceLabel
} from '@/utils/watch';

const categoryLabel = (category: Source['category']): string => {
  if (category === 'true_crime') return 'True crime';
  if (category === 'courts') return 'Courts';
  if (category === 'local') return 'Local';
  return 'News';
};

/**
 * Video detail.
 *
 * The player and its playlist live on one screen: on a phone the playlist
 * sits below the description, on a tablet it sits beside the player. That is
 * the whole point of the layout. A reader should be able to move through a
 * channel's uploads without bouncing back to a list, and the video's own
 * context — channel, counts, description — should not be reduced to a title
 * and a thumbnail.
 */
export default function VideoDetailScreen(): ReactElement {
  const { itemId, sourceId } = useLocalSearchParams<{
    itemId?: string;
    sourceId?: string;
  }>();
  const router = useRouter();
  const { colour, radius, spacing } = useTheme();
  const { gutter, isWide, contentWidth } = useLayout();
  const { width: windowWidth } = useWindowDimensions();

  const startMuted = useSetting('videoStartMuted');
  const captions = useSetting('captionsOn');
  const autoplayNext = useSetting('videoAutoplayNext');
  const showDescriptions = useSetting('showVideoDescriptions');

  const [currentId, setCurrentId] = useState(itemId ?? '');
  const [expanded, setExpanded] = useState(showDescriptions);

  useEffect(() => {
    setCurrentId(itemId ?? '');
  }, [itemId]);

  useEffect(() => {
    setExpanded(showDescriptions);
  }, [showDescriptions]);

  const { state: currentState, reload: reloadCurrent } = useItem(currentId);
  const current = currentState.status === 'success' ? currentState.data : null;
  const channelId = current?.sourceId ?? sourceId ?? '';
  const channelState = useSource(channelId);
  const channel = channelState.state.status === 'success' ? channelState.state.data : null;

  const channelVideos = useChannelVideos(channelId || null);
  const channels = useVideoChannels();
  const allVideos = useVideoFeed();

  const channelIndex = useMemo(() => {
    const index = new Map<string, Source>();
    for (const entry of channels.state.status === 'success'
      ? channels.state.data
      : []) {
      index.set(entry.id, entry);
    }
    return index;
  }, [channels.state]);

  const playlist = useMemo<ContentItem[]>(() => {
    const items =
      channelVideos.state.status === 'success'
        ? channelVideos.state.data.items
        : [];
    if (items.length > 0) return items;
    return current ? [current] : [];
  }, [channelVideos.state, current]);

  const currentIndex = playlist.findIndex((entry) => entry.id === currentId);
  const nextVideo =
    currentIndex >= 0 ? playlist[currentIndex + 1] : playlist[0];

  const related = useMemo<ContentItem[]>(() => {
    const items = allVideos.state.status === 'success' ? allVideos.state.data.items : [];
    const category = channel?.category;
    return items
      .filter((entry) => entry.id !== currentId)
      .filter((entry) => {
        if (!category) return true;
        const source = channelIndex.get(entry.sourceId);
        return source?.category === category;
      })
      .slice(0, 10);
  }, [allVideos.state, channel?.category, channelIndex, currentId]);

  const videoId = current ? youtubeVideoId(current.url) : null;
  const live = current ? isLiveVideo(current) : false;
  const views = current ? formatViewCount(current.viewCount) : null;
  const likes =
    current?.likeCount !== null && current?.likeCount !== undefined
      ? `${current.likeCount.toLocaleString('en-ZA')} likes`
      : null;

  const availableWidth = Math.min(windowWidth, contentWidth) - gutter * 2;
  const playerWidth = isWide
    ? Math.max(320, Math.round(availableWidth * 0.64))
    : Math.max(0, availableWidth);
  const playerHeight = Math.round((playerWidth * 9) / 16);

  const goBack = (): void => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/tabs/Watch');
  };

  const selectVideo = (next: ContentItem): void => {
    setCurrentId(next.id);
    setExpanded(showDescriptions);
  };

  const onEnded = (): void => {
    if (!autoplayNext) return;
    if (nextVideo) selectVideo(nextVideo);
  };

  const paragraphs = descriptionParagraphs(current?.excerpt ?? null);
  const description = paragraphs.length > 0 ? paragraphs : current?.excerpt ? [current.excerpt] : [];

  const player = current && videoId ? (
    <View style={{ gap: spacing.md }}>
      <YouTubePlayer
        key={videoId}
        videoId={videoId}
        width={playerWidth}
        height={playerHeight}
        muted={startMuted}
        captions={captions}
        onEnded={onEnded}
      />

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {live ? (
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.sm,
                backgroundColor: colour.danger
              }}
            >
              <Text variant='label' style={{ color: '#FFFFFF' }}>
                Live
              </Text>
            </View>
          ) : null}
          <Text variant='meta' tone='faint'>
            {[channel ? categoryLabel(channel.category) : 'Video', views, likes]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <Text variant={isWide ? 'h1' : 'h2'} accessibilityRole='header'>
          {current.title}
        </Text>

        <View style={styles.metaRow}>
          <Text variant='meta' tone='faint'>
            {[formatRelativeTime(current.publishedAt), views]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>
    </View>
  ) : null;

  const details = current ? (
    <View style={{ gap: spacing.md, paddingHorizontal: gutter }}>
      <View
        style={[
          styles.channelRow,
          {
            borderColor: colour.border,
            borderRadius: radius.lg,
            backgroundColor: colour.surface,
            padding: spacing.md,
            gap: spacing.md
          }
        ]}
      >
        <Thumb
          uri={current.imageUrl ?? ''}
          label={channel?.name}
          width={44}
          height={44}
          rounded
        />
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant='small' style={{ fontWeight: '700' }} numberOfLines={1}>
            {channel?.name ?? current.author ?? 'YouTube channel'}
          </Text>
          <Text variant='meta' tone='faint' numberOfLines={1}>
            {channel
              ? [categoryLabel(channel.category), channel.province ? provinceLabel(channel.province) : null]
                  .filter(Boolean)
                  .join(' · ')
              : 'Video channel'}
          </Text>
        </View>
        <FollowButton sourceId={current.sourceId} compact />

        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Open this video on YouTube'
          onPress={() => void openExternalUrl(current.url)}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: spacing.xs,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <ArrowSquareOutIcon size={20} color={colour.accent} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <SaveButton item={current} size={22} />
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Share video'
          onPress={() => void shareItem(current)}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: spacing.xs,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <ShareNetworkIcon size={20} color={colour.text} />
          <Text variant='small'>Share</Text>
        </Pressable>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='Watch on YouTube'
          onPress={() => void openExternalUrl(current.url)}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: spacing.xs,
            opacity: pressed ? 0.6 : 1
          })}
        >
          <ArrowSquareOutIcon size={20} color={colour.text} />
          <Text variant='small'>YouTube</Text>
        </Pressable>
      </View>

      <View
        style={{
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colour.border,
          borderRadius: radius.lg,
          backgroundColor: colour.surface,
          overflow: 'hidden'
        }}
      >
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={expanded ? 'Show less description' : 'Show full description'}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.md,
            backgroundColor: pressed ? colour.pressed : 'transparent',
            borderBottomWidth: expanded ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: colour.border
          })}
        >
          <Text variant='label' tone='faint'>
            About this video
          </Text>
          {expanded ? (
            <CaretUpIcon size={16} color={colour.textMuted} />
          ) : (
            <CaretDownIcon size={16} color={colour.textMuted} />
          )}
        </Pressable>

        {expanded ? (
          <View style={{ padding: spacing.md, gap: spacing.sm }}>
            {description.length > 0 ? (
              description.map((paragraph, index) => (
                <Text
                  key={`${index}-${paragraph.slice(0, 20)}`}
                  variant='small'
                  tone='muted'
                  selectable
                  style={{ lineHeight: 21 }}
                >
                  {paragraph}
                </Text>
              ))
            ) : (
              <Text variant='small' tone='faint'>
                This channel did not include a description in its feed. Open the
                video on YouTube for credits and links.
              </Text>
            )}
            <Text variant='meta' tone='faint'>
              Streamed by YouTube. NewzCrime does not host this video.
            </Text>
          </View>
        ) : null}
      </View>

      {live ? (
        <Text variant='meta' tone='faint'>
          This is a live stream. If the broadcast has ended, the player may show
          the most recent recording.
        </Text>
      ) : null}
    </View>
  ) : null;

  const playlistPanel = (
    <View
      style={[
        styles.playlist,
        {
          borderColor: colour.border,
          borderRadius: radius.lg,
          backgroundColor: colour.surface,
          padding: spacing.sm,
          gap: spacing.xs
        }
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xs,
          paddingVertical: spacing.xs
        }}
      >
        <Text variant='h4'>Up next</Text>
        <Text variant='meta' tone='faint'>
          {playlist.length} {playlist.length === 1 ? 'video' : 'videos'}
        </Text>
      </View>
      {channel ? (
        <Text variant='meta' tone='faint' style={{ paddingHorizontal: spacing.xs }}>
          From {channel.name}
        </Text>
      ) : null}

      {channelVideos.state.status === 'loading' ? (
        <ListSkeleton rows={3} />
      ) : null}

      {playlist.map((entry) => (
        <VideoRow
          key={entry.id}
          item={entry}
          sourceName={channel?.name}
          active={entry.id === currentId}
          onPress={() => selectVideo(entry)}
        />
      ))}
    </View>
  );

  return (
    <Screen>
      <ScreenHeader
        title='Watch'
        subtitle={channel?.name ?? 'Video'}
        onBack={goBack}
        actions={
          current ? (
            <>
              <SaveButton item={current} size={22} />
              <Pressable
                accessibilityRole='button'
                accessibilityLabel='Open on YouTube'
                onPress={() => void openExternalUrl(current.url)}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1
                })}
              >
                <ArrowSquareOutIcon size={22} color={colour.text} />
              </Pressable>
            </>
          ) : null
        }
      />

      {currentState.status === 'loading' || currentState.status === 'idle' ? (
        <ListSkeleton rows={4} />
      ) : null}

      {currentState.status === 'error' ? (		<ErrorState message={currentState.error} onRetry={reloadCurrent} />
      ) : null}

      {current ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        >
          <View
            style={{
              maxWidth: contentWidth,
              width: '100%',
              alignSelf: 'center',
              paddingTop: spacing.sm
            }}
          >
            <View
              style={{
                paddingHorizontal: gutter,
                width: isWide ? playerWidth : '100%'
              }}
            >
              {player}
            </View>

            <View
              style={{
                flexDirection: isWide ? 'row' : 'column',
                alignItems: 'flex-start',
                paddingTop: spacing.lg,
                gap: spacing.lg
              }}
            >
              <View style={{ flex: 1, width: isWide ? undefined : '100%' }}>
                {details}
              </View>
              <View
                style={{
                  width: isWide ? 340 : '100%',
                  paddingHorizontal: isWide ? 0 : gutter,
                  paddingRight: isWide ? gutter : undefined
                }}
              >
                {playlistPanel}
              </View>
            </View>

            {related.length > 0 ? (
              <View style={{ paddingTop: spacing.xl }}>
                <View style={{ paddingHorizontal: gutter }}>
                  <Text variant='h4'>More like this</Text>
                  <Text variant='meta' tone='faint'>
                    Other channels in this shelf
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: gutter,
                    paddingTop: spacing.md,
                    gap: spacing.md
                  }}
                >
                  {related.map((entry) => (
                    <VideoCard
                      key={entry.id}
                      item={entry}
                      sourceName={channelIndex.get(entry.sourceId)?.name}
                      onPress={() => selectVideo(entry)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth
  },
  playlist: {
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%'
  }
});
