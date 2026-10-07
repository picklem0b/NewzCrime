import { PauseIcon, PlayIcon, XIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useSourceIndex } from '@/hooks/useSources';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';

export interface MiniPlayerProps {
  onOpen: () => void;
}

export function MiniPlayer({ onOpen }: MiniPlayerProps): ReactElement | null {
  const { colour, elevation, spacing } = useTheme();
  const { current, status, toggle, stop, positionSeconds, durationSeconds } =
    usePlayer();
  const sourceIndex = useSourceIndex();

  if (!current) return null;

  const isPlaying = status === 'playing';
  const progress =
    durationSeconds > 0 ? Math.min(1, positionSeconds / durationSeconds) : 0;
  const showName = sourceIndex.get(current.sourceId)?.name;

  return (
    <View
      style={[
        elevation.floating,
        {
          backgroundColor: colour.surfaceRaised,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colour.borderStrong,
        },
      ]}
    >
      <View style={{ height: 2, backgroundColor: colour.border }}>
        <View
          style={{
            height: 2,
            width: `${Math.round(progress * 100)}%`,
            backgroundColor: colour.accent,
          }}
        />
      </View>

      <View
        style={[
          styles.bar,
          { paddingLeft: spacing.lg, paddingRight: spacing.xs, gap: spacing.md },
        ]}
      >
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={`Open player. ${current.title}`}
          onPress={onOpen}
          style={[styles.details, { gap: spacing.md }]}
        >
          {current.imageUrl ? (
            <Thumb uri={current.imageUrl} label={showName} width={40} height={40} />
          ) : null}

          <View style={styles.titles}>
            <Text variant='small' numberOfLines={1} style={{ fontWeight: '600' }}>
              {current.title}
            </Text>
            <Text variant='meta' tone='faint' numberOfLines={1}>
              {status === 'loading'
                ? 'Loading…'
                : showName ?? current.author ?? 'Podcast'}
            </Text>
          </View>
        </Pressable>

        <IconButton
          label={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            void toggle();
          }}
          icon={
            isPlaying ? (
              <PauseIcon size={24} color={colour.text} weight='fill' />
            ) : (
              <PlayIcon size={24} color={colour.text} weight='fill' />
            )
          }
        />

        <IconButton
          label='Stop playback and close player'
          onPress={() => {
            void stop();
          }}
          icon={<XIcon size={18} color={colour.textMuted} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 60 },
  details: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1 },
});

export default MiniPlayer;