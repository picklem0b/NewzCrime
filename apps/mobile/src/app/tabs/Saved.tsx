import type { ContentItem } from '@newzcrime/shared';
import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { ScrollView, Text, View } from 'react-native';
import EmptyState from '@/components/feedback/EmptyState';
import ScreenHeader from '@/components/layout/ScreenHeader';
import TabScreen from '@/components/layout/TabScreen';
import HeadlineRow from '@/components/feed/HeadlineRow';
import { useSaved } from '@/hooks/useSaved';
import { useSourceIndex } from '@/hooks/useSources';
import { useTheme } from '@/hooks/useTheme';
export default function SavedScreen(): ReactElement {
	const router = useRouter();
	const { colour, spacingX, spacingY, tabBar, typography } = useTheme();
	const { items } = useSaved();
	const sourceIndex = useSourceIndex();
	const open = (item: ContentItem) =>
		router.push({
			pathname: '/detail/ItemDetail',
			params: { itemId: item.id }
		});
	return (
		<TabScreen>
			<ScreenHeader
				eyebrow='Your library'
				title='Saved'
				subtitle={
					items.length
						? `${items.length} saved ${items.length === 1 ? 'item' : 'items'}`
						: 'Stories you want to return to'
				}
			/>
			{items.length === 0 ? (
				<View style={{ flex: 1, justifyContent: 'center' }}>
					<EmptyState
						title='Build your reading list'
						message='Save a story or episode and it will stay here on this device, even when you are offline.'
					/>
				</View>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: tabBar.clearance }}
				>
					{items.map(item => (
						<HeadlineRow
							key={item.id}
							item={item}
							sourceName={sourceIndex.get(item.sourceId)?.name}
							onPress={() => open(item)}
						/>
					))}
					<Text
						style={{
							color: colour.textFaint,
							fontSize: typography.size.caption,
							paddingHorizontal: spacingX.lg,
							paddingTop: spacingY.lg
						}}
					>
						Saved on this device. Account syncing is planned for a
						later release.
					</Text>
				</ScrollView>
			)}
		</TabScreen>
	);
}
