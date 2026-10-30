import type { ContentItem } from '@newzcrime/shared';
import { PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';
import { formatViewCount, isLiveVideo } from '@/utils/watch';

export interface VideoRowProps {
  item: ContentItem;
  sourceName?: string | undefined;
  active?: boolean;
  onPress: () => void;
}

/** A row in the Up next playlist, with the current video clearly marked. */
export function VideoRow({
  item,
  sourceName,
  active = false,
  onPress
}: VideoRowProps): ReactElement {
  const { colour, radius, spacing } = useTheme();
  const views = formatViewCount(item.viewCount);

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`${item.title}. ${sourceName ?? ''}. ${
        active ? 'Now playing. ' : ''
      }${formatRelativeTime(item.publishedAt)}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: active
            ? colour.accentSoft
            : pressed
              ? colour.pressed
              : 'transparent'
        }
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            width: 132,
            borderRadius: radius.md,
            borderColor: active ? colour.accent : colour.border
          }
        ]}
      >
        <Thumb
          uri={item.imageUrl ?? ''}
          label={sourceName}
          width='100%'
          aspectRatio={16 / 9}
          rounded={false}
        />
        {isLiveVideo(item) ? (
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: radius.sm,
              backgroundColor: colour.danger
            }}
          >
            <Text variant='label' style={{ color: '#FFFFFF' }}>
              Live
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.play,
              { backgroundColor: 'rgba(0,0,0,0.58)', borderRadius: radius.pill }
            ]}
          >
            <PlayIcon size={13} color='#FFFFFF' weight='fill' />
          </View>
        )}
      </View>

      <View style={styles.text}>
        <Text variant='small' numberOfLines={3} style={{ fontWeight: '600' }}>
          {item.title}
        </Text>
        <Text variant='meta' tone='faint' numberOfLines={1}>
          {sourceName ?? 'YouTube'}
        </Text>
        <Text variant='meta' tone='faint' numberOfLines={1}>
          {[views, formatRelativeTime(item.publishedAt)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  thumb: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth
  },
  play: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: { flex: 1, gap: 2 }
});

export default VideoRow;
