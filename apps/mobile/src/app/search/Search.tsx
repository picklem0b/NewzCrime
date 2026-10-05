import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import HeadlineRow from '@/components/feed/HeadlineRow';
import Screen from '@/components/layout/Screen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { useSearch } from '@/hooks/useSearch';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

/**
 * Search over stored articles and episodes.
 *
 * Runs against the local database and does not proxy third-party search APIs.
 */
export default function SearchScreen(): ReactElement {
  const router = useRouter();
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const [query, setQuery] = useState('');
  const { state, reload } = useSearch(query);
  const sourceIndex = useSourceIndex();

  const openItem = (item: ContentItem) =>
    router.push({ pathname: '/detail/ItemDetail', params: { itemId: item.id } });

  return (
    <Screen>
      <ScreenHeader
        title='Search'
        onBack={() => router.back()}
        subtitle='Articles and episodes'
      />

      <View
        style={[
          styles.input,
          {
            borderColor: colour.border,
            borderRadius: radius.pill,
            backgroundColor: colour.surface,
            marginHorizontal: spacingX.lg,
            paddingHorizontal: spacingX.lg,
            gap: spacingX.sm,
          },
        ]}
      >
        <MagnifyingGlassIcon size={18} color={colour.textFaint} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder='Search court, crime, a name…'
          placeholderTextColor={colour.textFaint}
          autoFocus
          returnKeyType='search'
          style={{
            flex: 1,
            color: colour.text,
            fontSize: typography.size.body,
            paddingVertical: spacingY.md,
          }}
        />

        {query.length > 0 ? (
          <Pressable
            accessibilityRole='button'
            accessibilityLabel='Clear search'
            onPress={() => setQuery('')}
            hitSlop={8}
          >
            <XIcon size={16} color={colour.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{ paddingTop: spacingY.lg, paddingBottom: spacingY.xxxl }}
      >
        {state.status === 'idle' ? (
          <Text
            style={{
              color: colour.textFaint,
              fontSize: typography.size.small,
              paddingHorizontal: spacingX.lg,
            }}
          >
            Type at least two characters.
          </Text>
        ) : null}

        {state.status === 'loading' ? <ListSkeleton rows={4} /> : null}

        {state.status === 'error' ? (
          <ErrorState message={state.error} onRetry={reload} />
        ) : null}

        {state.status === 'success' && state.data.items.length === 0 ? (
          <EmptyState
            icon={
              <MagnifyingGlassIcon size={36} color={colour.textFaint} weight='duotone' />
            }
            title='No matches'
            message={`Nothing stored matches “${query.trim()}”. Try a shorter word.`}
          />
        ) : null}

        {state.status === 'success'
          ? state.data.items.map((item) => (
              <HeadlineRow
                key={item.id}
                item={item}
                sourceName={sourceIndex.get(item.sourceId)?.name}
                onPress={() => openItem(item)}
              />
            ))
          : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
