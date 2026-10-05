import type { Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MagnifyingGlassIcon, NewspaperIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import ShowCard from '@/components/podcast/ShowCard';
import { useSources } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

/**
 * Discover: search, plus browsing every outlet and show the worker ingests.
 *
 * Split from Home so the feed stays a reading surface and browsing lives
 * somewhere else.
 */
export default function DiscoverScreen(): ReactElement {
  const router = useRouter();
  const { colour, radius, spacingX, spacingY, typography } = useTheme();
  const { state: sources, reload: reloadSources } = useSources();

  const openSearch = () => router.push('/search/Search');
  const openSource = (source: Source) =>
    router.push({ pathname: '/detail/SourceDetail', params: { sourceId: source.id } });

  const outlets =
    sources.status === 'success'
      ? sources.data.filter((source) => source.contentType !== 'podcast_episode')
      : [];
  const shows =
    sources.status === 'success'
      ? sources.data.filter((source) => source.contentType === 'podcast_episode')
      : [];

  return (
    <TabScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacingY.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={sources.status === 'loading'}
            onRefresh={reloadSources}
            tintColor={colour.textMuted}
          />
        }
      >
        <ScreenHeader title='Discover' subtitle='Search and browse' />

        <Pressable
          accessibilityRole='search'
          accessibilityLabel='Search stories'
          onPress={openSearch}
          style={[
            styles.searchBar,
            {
              borderColor: colour.border,
              borderRadius: radius.pill,
              backgroundColor: colour.surface,
              paddingHorizontal: spacingX.lg,
              paddingVertical: spacingY.md,
              marginHorizontal: spacingX.lg,
              gap: spacingX.sm,
            },
          ]}
        >
          <MagnifyingGlassIcon size={18} color={colour.textFaint} />
          <Text style={{ color: colour.textFaint, fontSize: typography.size.body }}>
            Search stories and episodes
          </Text>
        </Pressable>

        {sources.status === 'loading' || sources.status === 'idle' ? (
          <View style={{ paddingTop: spacingY.xl }}>
            <ListSkeleton rows={4} />
          </View>
        ) : null}

        {sources.status === 'error' ? (
          <ErrorState message={sources.error} onRetry={reloadSources} />
        ) : null}

        {sources.status === 'success' && sources.data.length === 0 ? (
          <EmptyState
            icon={
              <NewspaperIcon size={36} color={colour.textFaint} weight='duotone' />
            }
            title='No sources yet'
            message='Outlets and shows appear here once the worker has ingested their feeds.'
          />
        ) : null}

        {shows.length > 0 ? (
          <View style={{ paddingTop: spacingY.xl, gap: spacingY.md }}>
            <SectionHeading label='Podcast shows' />
            <View style={{ paddingHorizontal: spacingX.lg, gap: spacingY.md }}>
              {shows.map((show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  onPress={() => openSource(show)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {outlets.length > 0 ? (
          <View style={{ paddingTop: spacingY.xl, gap: spacingY.md }}>
            <SectionHeading label='Outlets' />
            <View style={{ paddingHorizontal: spacingX.lg, gap: spacingY.md }}>
              {outlets.map((outlet) => (
                <ShowCard
                  key={outlet.id}
                  show={outlet}
                  onPress={() => openSource(outlet)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </TabScreen>
  );
}

function SectionHeading({ label }: { label: string }): ReactElement {
  const { colour, spacingX, typography } = useTheme();

  return (
    <Text
      style={{
        color: colour.textFaint,
        fontSize: typography.size.caption,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: spacingX.lg,
      }}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
