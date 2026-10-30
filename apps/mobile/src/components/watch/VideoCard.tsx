import type { ContentItem, Source } from '@newzcrime/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';
import { formatViewCount, isLiveVideo } from '@/utils/watch';

export const VIDEO_CARD_WIDTH = 244;

export interface VideoCardProps {
  item: ContentItem;
  sourceName?: string | undefined;
  onPress: () => void;
}

/**
 * A 16:9 card for a horizontal rail.
 *
 * The image is the hierarchy: live badge, then title, then a single muted
 * metadata line. Nothing else competes, so the eye can scan a rail in one
 * pass.
 */
export function VideoCard({
  item,
  sourceName,
  onPress
}: VideoCardProps): ReactElement {
  const { colour, radius, spacing } = useTheme();
  const live = isLiveVideo(item);
  const views = formatViewCount(item.viewCount);

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`${item.title}. ${sourceName ?? ''}. ${
        live ? 'Live. ' : ''
      }${views ?? ''} ${formatRelativeTime(item.publishedAt)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: VIDEO_CARD_WIDTH,
          gap: spacing.xs,
          opacity: pressed ? 0.86 : 1
        }
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            borderRadius: radius.lg,
            borderColor: colour.border,
            backgroundColor: colour.surfaceRaised
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

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.42)']}
          style={StyleSheet.absoluteFill}
          pointerEvents='none'
        />

        {live ? (
          <View
            style={[
              styles.live,
              {
                backgroundColor: colour.danger,
                borderRadius: radius.sm
              }
            ]}
          >
            <View style={styles.liveDot} />
            <Text variant='label' style={{ color: '#FFFFFF' }}>
              Live
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.play,
            {
              backgroundColor: 'rgba(0,0,0,0.62)',
              borderRadius: radius.pill
            }
          ]}
        >
          <PlayIcon size={18} color='#FFFFFF' weight='fill' />
        </View>
      </View>

      <Text variant='h4' numberOfLines={2}>
        {item.title}
      </Text>

      <Text variant='meta' tone='faint' numberOfLines={1}>
        {[sourceName, views, formatRelativeTime(item.publishedAt)]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexShrink: 0 },
  thumb: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth
  },
  live: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#FFFFFF'
  },
  play: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default VideoCard;
