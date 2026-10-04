/**
 * Compact headline row.
 *
 * Used below the lead stories, where the list is scanned rather than read: time
 * and source above a two-line headline, with a thumbnail when the feed supplies
 * one.
 */

import type { ContentItem } from '@newzcrime/shared';
import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';

export interface HeadlineRowProps {
  item: ContentItem;
  sourceName?: string | undefined;
  onPress: () => void;
}

export function HeadlineRow({
  item,
  sourceName,
  onPress,
}: HeadlineRowProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const textScale = useTextScale();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={item.title}
      onPress={onPress}
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
      <View style={styles.textColumn}>
        <Text
          numberOfLines={1}
          style={{
            color: colour.textFaint,
            fontSize: typography.size.caption,
          }}
        >
          {sourceName ?? 'NewzCrime'} · {formatRelativeTime(item.publishedAt)}
        </Text>

        <Text
          numberOfLines={2}
          style={{
            color: colour.text,
            fontSize: typography.size.subtitle * textScale,
            fontWeight: typography.weight.semibold,
            lineHeight:
              typography.size.subtitle * textScale * typography.leading.snug,
            marginTop: 4,
          }}
        >
          {item.title}
        </Text>
      </View>

      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 76,
            height: 76,
            borderRadius: radius.input,
            backgroundColor: colour.surfaceRaised,
          }}
          contentFit='cover'
          transition={150}
        />
      ) : null}
    </Pressable>
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

export default HeadlineRow;
