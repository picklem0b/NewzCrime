import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookmarkSimpleIcon,
  ArrowSquareOutIcon,
  PauseIcon,
  PlayIcon,
  ShareNetworkIcon,
  SpeakerHighIcon,
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import CardAction from '@/components/feed/CardAction';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { useItem } from '@/hooks/useItem';
import { usePlayer } from '@/hooks/usePlayer';
import { useIsSaved, useSaved } from '@/hooks/useSaved';
import { useSpeech } from '@/hooks/useSpeech';
import { useSourceIndex } from '@/hooks/useSources';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { openExternalUrl, shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';

/**
 * Content detail — an article, judgment or podcast episode.
 *
 * The item id arrives as a query parameter because the route is static:
 *   `router.push({ pathname: '/detail/ItemDetail', params: { itemId } })`
 *
 * Shows the excerpt and links out to the publisher. The article body is never
 * reproduced.
 */
export default function ItemDetailScreen(): ReactElement {
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const router = useRouter();
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const textScale = useTextScale();

  const state = useItem(itemId ?? '');
  const sourceIndex = useSourceIndex();
  const isSaved = useIsSaved(itemId ?? '');
  const { toggle } = useSaved();
  const { speakingId, speak, stop } = useSpeech();
  const player = usePlayer();

  const item = state.status === 'success' ? state.data : null;
  const sourceName = item ? sourceIndex.get(item.sourceId)?.name : undefined;
  const isSpeaking = item !== null && speakingId === item.id;
  const isPlaying = item !== null && player.current?.id === item.id && player.status === 'playing';

  return (
    <Screen>
      <ScreenHeader title={sourceName ?? 'Story'} onBack={() => router.back()} />

      {state.status === 'loading' || state.status === 'idle' ? (
        <ListSkeleton rows={3} />
      ) : null}

      {state.status === 'error' ? <ErrorState message={state.error} /> : null}

      {item ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacingX.lg,
            paddingBottom: spacingY.xxxl,
            gap: spacingY.lg,
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: '100%',
                height: 208,
                borderRadius: radius.card,
                backgroundColor: colour.surfaceRaised,
              }}
              contentFit='cover'
              transition={150}
            />
          ) : null}

          <View style={{ gap: spacingY.sm }}>
            <Text
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
                fontSize: typography.size.heading * textScale,
                fontWeight: typography.weight.bold,
                lineHeight: typography.size.heading * textScale * typography.leading.tight,
                letterSpacing: -0.3,
              }}
            >
              {item.title}
            </Text>

            {item.author ? (
              <Text
                style={{
                  color: colour.textFaint,
                  fontSize: typography.size.small,
                }}
              >
                By {item.author}
              </Text>
            ) : null}
          </View>

          {item.excerpt ? (
            <Text
              style={{
                color: colour.text,
                fontSize: typography.size.body * textScale,
                lineHeight: typography.size.body * textScale * typography.leading.relaxed,
              }}
            >
              {item.excerpt}
            </Text>
          ) : null}

          {item.audioUrl ? (
            <Pressable
              accessibilityRole='button'
              onPress={() => {
                if (isPlaying) {
                  void player.toggle();
                  return;
                }
                void player.play(item);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacingX.sm,
                backgroundColor: colour.primary,
                borderRadius: radius.pill,
                paddingVertical: spacingY.md,
              }}
            >
              {isPlaying ? (
                <PauseIcon size={18} color={colour.onPrimary} weight='fill' />
              ) : (
                <PlayIcon size={18} color={colour.onPrimary} weight='fill' />
              )}
              <Text
                style={{
                  color: colour.onPrimary,
                  fontSize: typography.size.body,
                  fontWeight: typography.weight.semibold,
                }}
              >
                {isPlaying ? 'PauseIcon episode' : 'PlayIcon episode'}
              </Text>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.actions,
              { borderTopColor: colour.border, paddingTop: spacingY.lg },
            ]}
          >
            <CardAction
              label={isSpeaking ? 'Stop' : 'Read aloud'}
              active={isSpeaking}
              icon={
                isSpeaking ? (
                  <PauseIcon size={20} color={colour.primary} />
                ) : (
                  <SpeakerHighIcon size={20} color={colour.textMuted} />
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
              icon={<ShareNetworkIcon size={20} color={colour.textMuted} />}
              onPress={() => {
                void shareItem(item);
              }}
            />

            <CardAction
              label={isSaved ? 'Saved' : 'Save'}
              active={isSaved}
              icon={
                <BookmarkSimpleIcon
                  size={20}
                  color={isSaved ? colour.primary : colour.textMuted}
                  weight={isSaved ? 'fill' : 'regular'}
                />
              }
              onPress={() => toggle(item)}
            />

            <CardAction
              label='Open'
              icon={<ArrowSquareOutIcon size={20} color={colour.textMuted} />}
              onPress={() => {
                void openExternalUrl(item.url);
              }}
            />
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
