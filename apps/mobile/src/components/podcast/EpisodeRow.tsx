/**
 * One podcast episode.
 *
 * The play button starts the episode and queues the rest of the show behind it.
 * Episodes without an audio enclosure are listed but not playable.
 */

import type { ContentItem } from '@newzcrime/shared';
import { PauseIcon, PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';

export interface EpisodeRowProps {
  episode: ContentItem;
  /** The show's episodes, so playing one queues the rest. */
  queue?: ContentItem[];
  onPress: () => void;
}

export function EpisodeRow({
  episode,
  queue,
  onPress,
}: EpisodeRowProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const { current, status, play, toggle } = usePlayer();

  const isCurrent = current?.id === episode.id;
  const isPlaying = isCurrent && status === 'playing';
  const isPlayable = episode.audioUrl !== null;

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colour.border,
          paddingHorizontal: spacingX.lg,
          paddingVertical: spacingY.lg,
          gap: spacingX.md,
        },
      ]}
    >
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={episode.title}
        onPress={onPress}
        style={styles.textColumn}
      >
        <Text
          numberOfLines={1}
          style={{ color: colour.textFaint, fontSize: typography.size.caption }}
        >
          {formatRelativeTime(episode.publishedAt)}
          {episode.audioUrl ? '' : ' · No audio'}
        </Text>

        <Text
          numberOfLines={2}
          style={{
            color: colour.text,
            fontSize: typography.size.body,
            fontWeight: typography.weight.semibold,
            lineHeight: typography.size.body * typography.leading.snug,
            marginTop: 4,
          }}
        >
          {episode.title}
        </Text>
      </Pressable>

      {isPlayable ? (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={isPlaying ? 'PauseIcon episode' : 'PlayIcon episode'}
          onPress={() => {
            if (isCurrent) {
              void toggle();
              return;
            }
            void play(episode, queue);
          }}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.pill,
            backgroundColor: colour.surfaceRaised,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? (
            <PauseIcon size={18} color={colour.accent} weight='fill' />
          ) : (
            <PlayIcon size={18} color={colour.text} weight='fill' />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textColumn: { flex: 1 },
});

export default EpisodeRow;
