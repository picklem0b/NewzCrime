/**
 * The lead story card.
 *
 * Layout follows a news-reader convention: source and time above a headline,
 * a short excerpt, then the byline, with the image on the trailing edge.
 * Actions are outside the pressable body so tapping Listen or Save does not
 * open the publisher.
 */

import type { ContentItem } from '@newzcrime/shared';
import { Image } from 'expo-image';
import {
  BookmarkSimpleIcon,
  PauseIcon,
  ShareNetworkIcon,
  SpeakerHighIcon,
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useIsSaved, useSaved } from '@/hooks/useSaved';
import { useSpeech } from '@/hooks/useSpeech';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';

import CardAction from './CardAction';

export interface StoryCardProps {
  item: ContentItem;
  sourceName?: string | undefined;
  onPress: () => void;
}

export function StoryCard({
  item,
  sourceName,
  onPress,
}: StoryCardProps): ReactElement {
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const textScale = useTextScale();
  const isSaved = useIsSaved(item.id);
  const { toggle } = useSaved();
  const { speakingId, speak, stop } = useSpeech();

  const isSpeaking = speakingId === item.id;
  const byline = item.author
    ? `By ${item.author}`
    : sourceName
      ? `Sourced by ${sourceName}`
      : null;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: colour.border,
          borderRadius: radius.card,
          backgroundColor: colour.surface,
          padding: spacingX.lg,
          gap: spacingY.md,
        },
      ]}
    >
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={item.title}
        onPress={onPress}
        style={[styles.body, { gap: spacingX.md }]}
      >
        <View style={styles.textColumn}>
          <Text
            numberOfLines={1}
            style={{
              color: colour.accent,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
            }}
          >
            {sourceName ?? 'NewzCrime'} · {formatRelativeTime(item.publishedAt)}
          </Text>

          <Text
            style={{
              color: colour.text,
              fontSize: typography.size.title * textScale,
              fontWeight: typography.weight.semibold,
              lineHeight: typography.size.title * textScale * typography.leading.snug,
              marginTop: 6,
            }}
          >
            {item.title}
          </Text>

          {item.excerpt ? (
            <Text
              numberOfLines={3}
              style={{
                color: colour.textMuted,
                fontSize: typography.size.small * textScale,
                lineHeight:
                  typography.size.small * textScale * typography.leading.relaxed,
                marginTop: 6,
              }}
            >
              {item.excerpt}
            </Text>
          ) : null}

          {byline ? (
            <Text
              numberOfLines={1}
              style={{
                color: colour.textFaint,
                fontSize: typography.size.caption,
                marginTop: 6,
              }}
            >
              {byline}
            </Text>
          ) : null}
        </View>

        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: 104,
              height: 104,
              borderRadius: radius.input,
              backgroundColor: colour.surfaceRaised,
            }}
            contentFit='cover'
            transition={150}
          />
        ) : null}
      </Pressable>

      <View
        style={[
          styles.actions,
          { borderTopColor: colour.border, paddingTop: spacingY.sm },
        ]}
      >
        <CardAction
          label={isSpeaking ? 'Stop' : 'Listen'}
          active={isSpeaking}
          icon={
            isSpeaking ? (
              <PauseIcon size={18} color={colour.accent} />
            ) : (
              <SpeakerHighIcon size={18} color={colour.textMuted} />
            )
          }
          onPress={() => {
            if (isSpeaking) {
              stop();
              return;
            }
            speak(item.id, `${item.title}. ${item.excerpt ?? ''}`);
          }}
        />

        <CardAction
          label='Share'
          icon={<ShareNetworkIcon size={18} color={colour.textMuted} />}
          onPress={() => {
            void shareItem(item);
          }}
        />

        <CardAction
          label={isSaved ? 'Saved' : 'Save'}
          active={isSaved}
          icon={
            <BookmarkSimpleIcon
              size={18}
              color={isSaved ? colour.accent : colour.textMuted}
              weight={isSaved ? 'fill' : 'regular'}
            />
          }
          onPress={() => toggle(item)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  body: { flexDirection: 'row' },
  textColumn: { flex: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default StoryCard;
