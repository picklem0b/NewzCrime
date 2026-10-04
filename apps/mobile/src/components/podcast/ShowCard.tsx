/** One podcast show. Artwork is optional, so a placeholder is drawn instead. */

import type { Source } from '@newzcrime/shared';
import { Image } from 'expo-image';
import { MicrophoneIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface ShowCardProps {
  show: Source;
  onPress: () => void;
}

export function ShowCard({ show, onPress }: ShowCardProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={show.name}
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: colour.border,
          borderRadius: radius.card,
          backgroundColor: colour.surface,
          padding: spacingX.md,
          gap: spacingX.md,
        },
      ]}
    >
      {show.logoUrl ? (
        <Image
          source={{ uri: show.logoUrl }}
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.input,
            backgroundColor: colour.surfaceRaised,
          }}
          contentFit='cover'
          transition={150}
        />
      ) : (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.input,
            backgroundColor: colour.surfaceRaised,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicrophoneIcon size={24} color={colour.textFaint} weight='duotone' />
        </View>
      )}

      <View style={styles.textColumn}>
        <Text
          numberOfLines={2}
          style={{
            color: colour.text,
            fontSize: typography.size.body,
            fontWeight: typography.weight.semibold,
          }}
        >
          {show.name}
        </Text>

        {show.description ? (
          <Text
            numberOfLines={2}
            style={{
              color: colour.textMuted,
              fontSize: typography.size.caption,
              lineHeight:
                typography.size.caption * typography.leading.relaxed,
              marginTop: spacingY.xs,
            }}
          >
            {show.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textColumn: { flex: 1 },
});

export default ShowCard;
