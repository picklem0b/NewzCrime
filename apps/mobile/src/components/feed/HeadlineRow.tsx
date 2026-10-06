import type { ContentItem } from '@newzcrime/shared';
import { Image } from 'expo-image';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from '@/utils/time';
export interface HeadlineRowProps {
	item: ContentItem;
	sourceName?: string;
	onPress: () => void;
}
export default function HeadlineRow({
	item,
	sourceName,
	onPress
}: HeadlineRowProps): ReactElement {
	const { colour, radius, spacingX, spacingY, typography } = useTheme();
	const scale = useTextScale();
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={item.title}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				{
					borderBottomColor: colour.border,
					paddingHorizontal: spacingX.lg,
					paddingVertical: spacingY.lg,
					gap: spacingX.md,
					opacity: pressed ? 0.68 : 1
				}
			]}
		>
			<View style={styles.textColumn}>
				<Text
					numberOfLines={1}
					style={{
						color: colour.accent,
						fontSize: typography.size.caption,
						fontWeight: typography.weight.semibold,
						textTransform: 'uppercase',
						letterSpacing: 0.65
					}}
				>
					{sourceName ?? 'NewzCrime'} ·{' '}
					{formatRelativeTime(item.publishedAt)}
				</Text>
				<Text
					numberOfLines={2}
					style={{
						color: colour.text,
						fontSize: typography.size.subtitle * scale,
						fontWeight: typography.weight.semibold,
						lineHeight:
							typography.size.subtitle *
							scale *
							typography.leading.snug,
						marginTop: 5
					}}
				>
					{item.title}
				</Text>
				<Text
					numberOfLines={1}
					style={{
						color: colour.textFaint,
						fontSize: typography.size.caption,
						marginTop: 5
					}}
				>
					{item.topic ? item.topic.replace('_', ' ') : 'News'}
				</Text>
			</View>
			{item.imageUrl ? (
				<Image
					source={{ uri: item.imageUrl }}
					style={{
						width: 82,
						height: 82,
						borderRadius: radius.input,
						backgroundColor: colour.surfaceRaised
					}}
					contentFit='cover'
					transition={150}
				/>
			) : (
				<View
					style={{
						width: 5,
						height: 58,
						borderRadius: 3,
						backgroundColor: colour.accent
					}}
				/>
			)}
		</Pressable>
	);
}
const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	textColumn: { flex: 1 }
});
