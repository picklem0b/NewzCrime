import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowSquareOutIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from 'phosphor-react-native';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { useItem } from '@/hooks/useItem';
import { usePlayer } from '@/hooks/usePlayer';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { usePlayerStore } from '@/stores/player.store';
import { openExternalUrl } from '@/utils/external';
import { formatDuration } from '@/utils/time';

/** Seconds moved by the skip buttons. */
const SKIP_SECONDS = 15;

/**
 * Player — podcast and audio playback.
 *
 * Playback runs through `react-native-track-player`, so it continues with the
 * screen off and exposes lock-screen controls. Arriving with an `itemId` starts
 * that episode if something else was loaded.
 */
export default function PlayerScreen(): ReactElement {
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const router = useRouter();
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  const requested = useItem(itemId ?? '');
  const play = usePlayerStore((state) => state.play);
  const player = usePlayer();
  const sourceIndex = useSourceIndex();

  const requestedItem = requested.status === 'success' ? requested.data : null;
  const currentId = player.current?.id;

  useEffect(() => {
    if (!requestedItem?.audioUrl) return;
    if (requestedItem.id === currentId) return;
    void play(requestedItem);
  }, [requestedItem, currentId, play]);

  const episode = player.current;
  const sourceName = episode
    ? sourceIndex.get(episode.sourceId)?.name
    : undefined;

  const duration = player.durationSeconds;
  const progress =
    duration > 0
      ? Math.min(1, Math.max(0, player.positionSeconds / duration))
      : 0;

  return (
    <Screen>
      <ScreenHeader title='Now playing' onBack={() => router.back()} />

      {episode ? (
        <View
          style={[
            styles.content,
            { paddingHorizontal: spacingX.xl, gap: spacingY.xl },
          ]}
        >
          {episode.imageUrl ? (
            <Image
              source={{ uri: episode.imageUrl }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: radius.sheet,
                backgroundColor: colour.surfaceRaised,
              }}
              contentFit='cover'
              transition={150}
            />
          ) : (
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: radius.sheet,
                backgroundColor: colour.surface,
              }}
            />
          )}

          <View style={{ gap: spacingY.xs }}>
            <Text
              numberOfLines={3}
              style={{
                color: colour.text,
                fontSize: typography.size.title,
                fontWeight: typography.weight.bold,
                lineHeight:
                  typography.size.title * typography.leading.snug,
              }}
            >
              {episode.title}
            </Text>

            <Text
              numberOfLines={1}
              style={{ color: colour.textMuted, fontSize: typography.size.small }}
            >
              {sourceName ?? episode.author ?? 'NewzCrime'}
            </Text>
          </View>

          <View style={{ gap: spacingY.sm }}>
            <View
              style={{
                height: 3,
                borderRadius: 2,
                backgroundColor: colour.border,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: '100%',
                  backgroundColor: colour.primary,
                }}
              />
            </View>

            <View style={styles.times}>
              <Text
                style={{ color: colour.textFaint, fontSize: typography.size.caption }}
              >
                {formatDuration(player.positionSeconds)}
              </Text>
              <Text
                style={{ color: colour.textFaint, fontSize: typography.size.caption }}
              >
                {formatDuration(duration)}
              </Text>
            </View>
          </View>

          <View style={[styles.controls, { gap: spacingX.xl }]}>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Previous episode'
              onPress={() => {
                void player.previous();
              }}
              hitSlop={10}
            >
              <SkipBackIcon size={28} color={colour.textMuted} weight='fill' />
            </Pressable>

            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`Back ${SKIP_SECONDS} seconds`}
              onPress={() => {
                void player.skipBy(-SKIP_SECONDS);
              }}
              hitSlop={10}
            >
              <Text
                style={{
                  color: colour.text,
                  fontSize: typography.size.small,
                  fontWeight: typography.weight.semibold,
                }}
              >
                −{SKIP_SECONDS}s
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole='button'
              accessibilityLabel={player.status === 'playing' ? 'Pause' : 'Play'}
              onPress={() => {
                void player.toggle();
              }}
              style={{
                width: 68,
                height: 68,
                borderRadius: radius.pill,
                backgroundColor: colour.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {player.status === 'playing' ? (
                <PauseIcon size={28} color={colour.onPrimary} weight='fill' />
              ) : (
                <PlayIcon size={28} color={colour.onPrimary} weight='fill' />
              )}
            </Pressable>

            <Pressable
              accessibilityRole='button'
              accessibilityLabel={`Forward ${SKIP_SECONDS} seconds`}
              onPress={() => {
                void player.skipBy(SKIP_SECONDS);
              }}
              hitSlop={10}
            >
              <Text
                style={{
                  color: colour.text,
                  fontSize: typography.size.small,
                  fontWeight: typography.weight.semibold,
                }}
              >
                +{SKIP_SECONDS}s
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Next episode'
              onPress={() => {
                void player.next();
              }}
              hitSlop={10}
            >
              <SkipForwardIcon size={28} color={colour.textMuted} weight='fill' />
            </Pressable>
          </View>

          {player.error ? (
            <Text
              style={{
                color: colour.danger,
                fontSize: typography.size.small,
                textAlign: 'center',
              }}
            >
              {player.error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole='button'
            onPress={() => {
              void openExternalUrl(episode.url);
            }}
            style={[styles.showNotes, { gap: spacingX.sm }]}
          >
            <ArrowSquareOutIcon size={16} color={colour.textMuted} />
            <Text style={{ color: colour.textMuted, fontSize: typography.size.small }}>
              Open episode page
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.empty,
            { paddingHorizontal: spacingX.xl, paddingVertical: spacingY.xxxl },
          ]}
        >
          <Text
            style={{
              color: colour.textMuted,
              fontSize: typography.size.body,
              textAlign: 'center',
            }}
          >
            Nothing is playing. Pick an episode from the Podcasts tab.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, gap: 24 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
