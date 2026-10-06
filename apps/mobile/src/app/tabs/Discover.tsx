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
	View
} from 'react-native';
import EmptyState from '@/components/feedback/EmptyState';
import ErrorState from '@/components/feedback/ErrorState';
import ListSkeleton from '@/components/feedback/ListSkeleton';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import ShowCard from '@/components/podcast/ShowCard';
import { useSources } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
export default function DiscoverScreen(): ReactElement {
	const router = useRouter();
	const { colour, radius, spacingX, spacingY, tabBar, typography } =
		useTheme();
	const { state: sources, reload } = useSources();
	const openSource = (source: Source) =>
		router.push({
			pathname: '/detail/SourceDetail',
			params: { sourceId: source.id }
		});
	const outlets =
		sources.status === 'success'
			? sources.data.filter(
					source => source.contentType !== 'podcast_episode'
				)
			: [];
	const shows =
		sources.status === 'success'
			? sources.data.filter(
					source => source.contentType === 'podcast_episode'
				)
			: [];
	return (
		<TabScreen>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: tabBar.clearance }}
				refreshControl={
					<RefreshControl
						refreshing={sources.status === 'loading'}
						onRefresh={reload}
						tintColor={colour.textMuted}
					/>
				}
			>
				<ScreenHeader
					eyebrow='Explore'
					title='Discover'
					subtitle='Find trusted outlets and shows'
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
							marginHorizontal: spacingX.lg,
							padding: spacingX.lg,
							gap: spacingX.sm,
							opacity: pressed ? 0.75 : 1
						}
					]}
				>
					<MagnifyingGlassIcon size={19} color={colour.accent} />
					<Text
						style={{
							color: colour.textMuted,
							fontSize: typography.size.body
						}}
					>
						Search stories, names or topics
					</Text>
				</Pressable>
				<Text
					style={[
						styles.kicker,
						{
							color: colour.textFaint,
							paddingHorizontal: spacingX.lg,
							marginTop: spacingY.xxl
						}
					]}
				>
					Browse the reporting network
				</Text>
				{sources.status === 'loading' || sources.status === 'idle' ? (
					<ListSkeleton rows={4} />
				) : null}
				{sources.status === 'error' ? (
					<ErrorState message={sources.error} onRetry={reload} />
				) : null}
				{sources.status === 'success' && sources.data.length === 0 ? (
					<EmptyState
						icon={
							<NewspaperIcon
								size={36}
								color={colour.textFaint}
								weight='duotone'
							/>
						}
						title='No sources yet'
						message='Outlets and shows appear once the worker has ingested their feeds.'
					/>
				) : null}
				{shows.length > 0 ? (
					<View style={{ marginTop: spacingY.md, gap: spacingY.md }}>
						<Text
							style={[
								styles.kicker,
								{
									color: colour.textFaint,
									paddingHorizontal: spacingX.lg
								}
							]}
						>
							Podcasts
						</Text>
						<View
							style={{
								paddingHorizontal: spacingX.lg,
								gap: spacingY.md
							}}
						>
							{shows.map(show => (
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
					<View style={{ marginTop: spacingY.xxl, gap: spacingY.md }}>
						<Text
							style={[
								styles.kicker,
								{
									color: colour.textFaint,
									paddingHorizontal: spacingX.lg
								}
							]}
						>
							News outlets
						</Text>
						<View
							style={{
								paddingHorizontal: spacingX.lg,
								gap: spacingY.md
							}}
						>
							{outlets.map(outlet => (
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
const styles = StyleSheet.create({
	search: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: StyleSheet.hairlineWidth
	},
	kicker: {
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1.1,
		textTransform: 'uppercase'
	}
});
