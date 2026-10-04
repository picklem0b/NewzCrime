import type { ContentItem } from '@newzcrime/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowSquareOutIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import HeadlineRow from '@/components/feed/HeadlineRow';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import EpisodeRow from '@/components/podcast/EpisodeRow';
import { useSource, useSourceItems } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
import { openExternalUrl } from '@/utils/external';

/**
 * Source detail — items from one outlet or one podcast show.
 *
 * Both are rows in `sources`, distinguished by `contentType`, which decides
 * whether rows get a play control.
 */
export default function SourceDetailScreen(): ReactElement {
  const { sourceId } = useLocalSearchParams<{ sourceId?: string }>();
  const router = useRouter();
  const { colour, spacingX, spacingY } = useTheme();

  const source = useSource(sourceId ?? '');
  const items = useSourceItems(sourceId ?? '');

  const isPodcast =
    source.status === 'success' &&
    source.data.contentType === 'podcast_episode';

  const openItem = (item: ContentItem) =>
    router.push({ pathname: '/detail/ItemDetail', params: { itemId: item.id } });

  const playable =
    items.status === 'success'
      ? items.data.items.filter((item) => item.audioUrl)
      : [];

  return (
    <Screen>
      <ScreenHeader
        title={source.status === 'success' ? source.data.name : 'Source'}
        subtitle={
          source.status === 'success'
            ? source.data.description ?? source.data.feedUrl
            : undefined
        }
        onBack={() => router.back()}
        actions={
          source.status === 'success' && source.data.siteUrl ? (
            <Pressable
              accessibilityRole='button'
              accessibilityLabel='Open website'
              onPress={() => {
                void openExternalUrl(source.data.siteUrl ?? '');
              }}
              hitSlop={8}
            >
              <ArrowSquareOutIcon size={20} color={colour.text} />
            </Pressable>
          ) : undefined
        }
      />

      {items.status === 'loading' || items.status === 'idle' ? (
        <View style={{ paddingTop: spacingY.lg }}>
          <ListSkeleton rows={5} />
        </View>
      ) : null}

      {items.status === 'error' ? <ErrorState message={items.error} /> : null}

      {items.status === 'success' && items.data.items.length === 0 ? (
        <EmptyState
          title='Nothing stored yet'
          message='The worker has not collected items from this source on its last run.'
        />
      ) : null}

      {items.status === 'success' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacingY.xxxl }}
        >
          {items.data.items.map((item) =>
            isPodcast ? (
              <EpisodeRow
                key={item.id}
                episode={item}
                queue={playable}
                onPress={() => openItem(item)}
              />
            ) : (
              <HeadlineRow
                key={item.id}
                item={item}
                sourceName={
                  source.status === 'success' ? source.data.name : undefined
                }
                onPress={() => openItem(item)}
              />
            )
          )}

          {items.data.nextCursor ? (
            <Text
              style={{
                color: colour.textFaint,
                fontSize: 12,
                paddingHorizontal: spacingX.lg,
                paddingTop: spacingY.lg,
              }}
            >
              Showing the latest items. Older items load as the feed supports
              paging on this screen.
            </Text>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}
