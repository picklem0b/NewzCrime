import type { Source } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import { MagnifyingGlassIcon, NewspaperIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import ShowTile from '@/components/podcast/ShowTile';
import SourceRow from '@/components/source/SourceRow';
import Column from '@/components/ui/Column';
import SectionHeader from '@/components/ui/SectionHeader';
import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useSources } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';

const PODCAST_TYPE = 'podcast_episode';

/**
 * Discover: the outlets and shows the reader can browse.
 *
 * `useSources` exposes the shared directory store, so this screen and the
 * Search tab read one fetch rather than competing ones. Loading, error and
 * empty are rendered explicitly, because a directory that is still arriving
 * looks the same as one that is empty otherwise.
 */
export default function DiscoverScreen(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacing } = useTheme();
	const { gutter } = useLayout();
	const { sources, status, error, reload } = useSources();

	const openSource = (source: Source) =>
		router.push({
			pathname: '/detail/SourceDetail',
			params: { sourceId: source.id }
		});

	const shows = sources.filter(source => source.contentType === PODCAST_TYPE);
	const outlets = sources.filter(source => source.contentType !== PODCAST_TYPE);

	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: spacing.xxxl,
					gap: spacing.lg
				}}
				refreshControl={
					<RefreshControl
						refreshing={status === 'loading'}
						onRefresh={reload}
						tintColor={colour.textMuted}
						colors={[colour.accent]}
					/>
				}
			>
				<Column>
					<ScreenHeader
						title='Discover'
						subtitle='Trusted outlets and shows'
						large
					/>

					<Pressable
						accessibilityRole='search'
						accessibilityLabel='Search stories'
						onPress={() => router.push('/search/Search')}
						style={({ pressed }) => [
							styles.search,
							{
								borderColor: colour.border,
								borderRadius: radius.pill,
								backgroundColor: colour.surface,
								marginHorizontal: gutter,
								paddingHorizontal: spacing.lg,
								paddingVertical: spacing.md,
								gap: spacing.sm,
								opacity: pressed ? 0.75 : 1
							}
						]}
					>
						<MagnifyingGlassIcon size={19} color={colour.accent} />
						<Text variant='body' tone='muted'>
							Search stories, names or topics
						</Text>
					</Pressable>
				</Column>

				{status === 'loading' || status === 'idle' ? (
					<ListSkeleton rows={4} />
				) : null}

				{status === 'error' ? (
					<Column>
						<ErrorState message={error ?? ''} onRetry={reload} />
					</Column>
				) : null}

				{status === 'success' && sources.length === 0 ? (
					<Column>
						<EmptyState
							icon={
								<NewspaperIcon
									size={32}
									color={colour.textMuted}
								/>
							}
							title='No sources yet'
							message='Outlets and shows appear once the worker has collected their feeds.'
						/>
					</Column>
				) : null}

				{shows.length > 0 ? (
					<Column>
						<SectionHeader title='Podcasts' />
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{
								paddingHorizontal: gutter - 3,
								paddingVertical: spacing.sm,
								gap: spacing.sm
							}}
						>
							{shows.map(show => (
								<ShowTile
									key={show.id}
									show={show}
									selected={false}
									onPress={() => openSource(show)}
								/>
							))}
						</ScrollView>
					</Column>
				) : null}

				{outlets.length > 0 ? (
					<Column>
						<SectionHeader title='News outlets' />
						<View>
							{outlets.map(outlet => (
								<SourceRow
									key={outlet.id}
									source={outlet}
									onPress={() => openSource(outlet)}
								/>
							))}
						</View>
					</Column>
				) : null}
			</ScrollView>
		</TabScreen>
	);
}

const styles = StyleSheet.create({
	search: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 48,
		borderWidth: StyleSheet.hairlineWidth
	}
});
