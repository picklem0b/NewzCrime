import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { ScrollView, Text } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import HeadlineRow from '@/components/feed/HeadlineRow';
import { useSaved } from '@/hooks/useSaved';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

/**
 * Saved: bookmarked articles and episodes.
 *
 * Bookmarks are stored on the device until accounts exist, so this list is
 * local and survives without a network.
 */
export default function SavedScreen(): ReactElement {
  const router = useRouter();
  const { colour, spacingX, spacingY, typography } = useTheme();
  const { items } = useSaved();
  const sourceIndex = useSourceIndex();

  const openItem = (item: ContentItem) =>
    router.push({ pathname: '/detail/ItemDetail', params: { itemId: item.id } });

  return (
    <TabScreen>
      <ScreenHeader
        title='Saved'
        subtitle={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
      />

      {items.length === 0 ? (
        <EmptyState
          title='Nothing saved yet'
          message='Tap Save on a story or episode and it will be waiting here, even offline.'
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacingY.xxxl }}
        >
          {items.map((item) => (
            <HeadlineRow
              key={item.id}
              item={item}
              sourceName={sourceIndex.get(item.sourceId)?.name}
              onPress={() => openItem(item)}
            />
          ))}

          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.caption,
              paddingHorizontal: spacingX.lg,
              paddingTop: spacingY.lg,
            }}
          >
            Saved on this device. Signing in will sync them in a later release.
          </Text>
        </ScrollView>
      )}
    </TabScreen>
  );
}

