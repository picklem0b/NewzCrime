/** Player bar shown above the tab bar while an episode is loaded. */

import { Image } from 'expo-image';
import { PauseIcon, PlayIcon, XIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';

export interface MiniPlayerProps {
  onOpen: () => void;
}

export function MiniPlayer({ onOpen }: MiniPlayerProps): ReactElement | null {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const { current, status, toggle, stop } = usePlayer();

  if (!current) return null;

  return (
    <View
      style={[
        styles.bar,
        {
          borderTopColor: colour.border,
          backgroundColor: colour.surfaceRaised,
          paddingHorizontal: spacingX.lg,
          paddingVertical: spacingY.sm,
          gap: spacingX.md,
        },
      ]}
    >
      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Open player'
        onPress={onOpen}
        style={[styles.details, { gap: spacingX.md }]}
      >
        {current.imageUrl ? (
          <Image
            source={{ uri: current.imageUrl }}
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.input,
              backgroundColor: colour.surface,
            }}
            contentFit='cover'
          />
        ) : null}

        <Text
          numberOfLines={1}
          style={{
            color: colour.text,
            fontSize: typography.size.small,
            flex: 1,
          }}
        >
          {current.title}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole='button'
        accessibilityLabel={status === 'playing' ? 'PauseIcon' : 'PlayIcon'}
        onPress={() => {
          void toggle();
        }}
        hitSlop={8}
      >
        {status === 'playing' ? (
          <PauseIcon size={20} color={colour.text} weight='fill' />
        ) : (
          <PlayIcon size={20} color={colour.text} weight='fill' />
        )}
      </Pressable>

      <Pressable
        accessibilityRole='button'
        accessibilityLabel='Close player'
        onPress={() => {
          void stop();
        }}
        hitSlop={8}
      >
        <XIcon size={18} color={colour.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  details: { flexDirection: 'row', alignItems: 'center', flex: 1 },
});

export default MiniPlayer;
