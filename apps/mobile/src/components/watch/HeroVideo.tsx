import type { ContentItem } from '@newzcrime/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import Text from '@/components/ui/Text';
import Thumb from '@/components/ui/Thumb';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';
import { formatViewCount, isLiveVideo } from '@/utils/watch';

export interface HeroVideoProps {
  item: ContentItem;
  sourceName?: string | undefined;
  railLabel: string;
  onPress: () => void;
}

/**
 * The one video the tab leads with.
 *
 * A full-bleed still with a bottom scrim and a play affordance is the clearest
 * possible "start here": the image does the work, the text stays legible in
 * both palettes, and no autoplay is used, so opening Watch costs no data.
 */
export function HeroVideo({
  item,
  sourceName,
  railLabel,
  onPress
}: HeroVideoProps): ReactElement {
  const { colour, radius, spacing } = useTheme();
  const live = isLiveVideo(item);
  const views = formatViewCount(item.viewCount);

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={`${item.title}. ${sourceName ?? ''}. ${railLabel}. ${
        live ? 'Live. ' : ''
      }${views ?? ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hero,
        {
          borderRadius: radius.lg,
          borderColor: colour.border,
          opacity: pressed ? 0.94 : 1
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
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0.86)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents='none'
      />

      <View style={[styles.top, { padding: spacing.md }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm
          }}
        >
          {live ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.sm,
                backgroundColor: colour.danger
              }}
            >
              <View style={styles.dot} />
              <Text variant='label' style={{ color: '#FFFFFF' }}>
                Live
              </Text>
            </View>
          ) : null}
          <Text variant='label' style={{ color: 'rgba(255,255,255,0.82)' }}>
            {railLabel}
          </Text>
        </View>
      </View>

      <View style={[styles.bottom, { padding: spacing.md, gap: spacing.xs }]}>
        <Text
          variant='h2'
          numberOfLines={3}
          style={{ color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 8 }}
        >
          {item.title}
        </Text>
        <Text variant='meta' style={{ color: 'rgba(255,255,255,0.82)' }}>
          {[sourceName, views, formatRelativeTime(item.publishedAt)]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      <View
        style={[
          styles.play,
          {
            right: spacing.md,
            bottom: spacing.md,
            borderColor: 'rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(0,0,0,0.38)'
          }
        ]}
      >
        <PlayIcon size={24} color='#FFFFFF' weight='fill' />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth
  },
  top: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  play: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#FFFFFF' }
});

export default HeroVideo;
