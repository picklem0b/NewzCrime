import { FlashList } from '@shopify/flash-list';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MagnifyingGlassIcon } from 'phosphor-react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import HeadlineRow from '@/components/feed/HeadlineRow';
import StoryCard from '@/components/feed/StoryCard';
import TopicChips from '@/components/feed/TopicChips';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import { useFeed } from '@/hooks/useFeed';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

/** How many items get the full card treatment before the list goes compact. */
const LEAD_STORY_COUNT = 2;

export default function HomeScreen(): ReactElement {
  const router = useRouter();
  const { colour, spacingX, spacingY, typography } = useTheme();
  const [topic, setTopic] = useState<Topic>('all');

  const feed = useFeed({ topic });
  const sourceIndex = useSourceIndex();

  const openSearch = () => router.push('/search/Search');
  const openItem = (item: ContentItem) =>
    router.push({ pathname: '/detail/ItemDetail', params: { itemId: item.id } });

  const header = (
    <View>
      <ScreenHeader
        title='NewzCrime'
        subtitle={
          feed.state.status === 'success'
            ? `${feed.items.length} stories${feed.hasMore ? ' and more' : ''}`
            : 'Court, crime and justice'
        }
        actions={
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Search'
            onPress={openSearch}
            hitSlop={8}
          >
            <MagnifyingGlassIcon size={22} color={colour.text} />
          </Pressable>
        }
      />

      <TopicChips value={topic} onChange={setTopic} />

      {feed.state.status === 'loading' ? <ListSkeleton /> : null}

      {feed.state.status === 'error' ? (
        <ErrorState message={feed.state.error} onRetry={feed.refresh} />
      ) : null}

      {feed.state.status === 'success' && feed.items.length === 0 ? (
        <EmptyState
          title='Nothing here yet'
          message='No stories match this filter. Try another topic, or pull down to refresh.'
        />
      ) : null}
    </View>
  );

  const leads = feed.items.slice(0, LEAD_STORY_COUNT);
  const rest = feed.items.slice(LEAD_STORY_COUNT);

  return (
    <TabScreen>
      <FlashList
        data={rest}
        keyExtractor={(item) => item.id}
        estimatedItemSize={132}
        renderItem={({ item }) => (
          <HeadlineRow
            item={item}
            sourceName={sourceIndex.get(item.sourceId)?.name}
            onPress={() => openItem(item)}
          />
        )}
        ListHeaderComponent={
          <View>
            {header}

            {leads.length > 0 ? (
              <View
                style={{
                  paddingHorizontal: spacingX.lg,
                  paddingTop: spacingY.md,
                  paddingBottom: spacingY.lg,
                  gap: spacingY.lg,
                }}
              >
                {leads.map((item) => (
                  <StoryCard
                    key={item.id}
                    item={item}
                    sourceName={sourceIndex.get(item.sourceId)?.name}
                    onPress={() => openItem(item)}
                  />
                ))}
              </View>
            ) : null}

            {rest.length > 0 ? (
              <Text
                style={{
                  color: colour.textFaint,
                  fontSize: typography.size.caption,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  paddingHorizontal: spacingX.lg,
                  paddingBottom: spacingY.sm,
                }}
              >
                More headlines
              </Text>
            ) : null}
          </View>
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          feed.isLoadingMore ? (
            <ActivityIndicator
              color={colour.textMuted}
              style={{ paddingVertical: spacingY.xl }}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={feed.refresh}
            tintColor={colour.textMuted}
          />
        }
      />
    </TabScreen>
  );
}

