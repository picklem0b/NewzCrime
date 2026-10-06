import type { ContentItem } from '@newzcrime/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
	BookmarkSimpleIcon,
	CaretRightIcon,
	ShareNetworkIcon,
	SpeakerHighIcon,
	StopIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsSaved, useSaved } from '@/hooks/useSaved';
import { useSpeech } from '@/hooks/useSpeech';
import { useTextScale } from '@/hooks/useTextScale';
import { useTheme } from '@/hooks/useTheme';
import { shareItem } from '@/utils/external';
import { formatRelativeTime } from '@/utils/time';
import CardAction from './CardAction';
export interface StoryCardProps {
	item: ContentItem;
	sourceName?: string;
	onPress: () => void;
	featured?: boolean;
}
export default function StoryCard({
	item,
	sourceName,
	onPress,
	featured = false
}: StoryCardProps): ReactElement {
	const { colour, radius, spacingY, typography } = useTheme();
	const scale = useTextScale();
	const saved = useIsSaved(item.id);
	const { toggle } = useSaved();
	const { speakingId, speak, stop } = useSpeech();
	const speaking = speakingId === item.id;
	const topic = item.topic ? item.topic.replace('_', ' ') : 'News';
	if (featured)
		return (
			<View
				style={[
					styles.featured,
					{
						borderRadius: radius.card,
						backgroundColor: colour.surfaceRaised,
						shadowColor: '#000'
					}
				]}
			>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel={item.title}
					onPress={onPress}
					style={({ pressed }) => [
						styles.featuredPress,
						{ opacity: pressed ? 0.9 : 1 }
					]}
				>
					{item.imageUrl ? (
						<Image
							source={{ uri: item.imageUrl }}
							style={StyleSheet.absoluteFill}
							contentFit='cover'
							transition={180}
						/>
					) : null}
					<LinearGradient
						colors={['rgba(10,12,14,0.05)', 'rgba(10,12,14,0.88)']}
						locations={[0.2, 1]}
						style={StyleSheet.absoluteFill}
					/>
					<View style={styles.featuredTop}>
						<Text style={styles.livePill}>● LIVE</Text>
						<Text style={styles.location}>South Africa</Text>
					</View>
					<View style={styles.featuredCopy}>
						<Text style={styles.featuredKicker}>
							TOP STORY · {topic.toUpperCase()}
						</Text>
						<Text
							style={[
								styles.featuredTitle,
								{
									fontSize:
										typography.size.display * 0.86 * scale
								}
							]}
						>
							{item.title}
						</Text>
						{item.excerpt ? (
							<Text
								numberOfLines={2}
								style={styles.featuredExcerpt}
							>
								{item.excerpt}
							</Text>
						) : null}
						<View style={styles.featuredMeta}>
							<Text style={styles.featuredMetaText}>
								{formatRelativeTime(item.publishedAt)} ·{' '}
								{sourceName ?? 'NewzCrime'}
							</Text>
							<View style={styles.nextCircle}>
								<CaretRightIcon
									size={22}
									color='#fff'
									weight='bold'
								/>
							</View>
						</View>
					</View>
				</Pressable>
			</View>
		);
	return (
		<View
			style={[
				styles.wrap,
				{
					backgroundColor: colour.surfaceRaised,
					borderRadius: radius.card,
					shadowColor: '#000'
				}
			]}
		>
			<Pressable
				accessibilityRole='button'
				accessibilityLabel={item.title}
				onPress={onPress}
				style={({ pressed }) => [
					styles.row,
					{ opacity: pressed ? 0.78 : 1 }
				]}
			>
				{item.imageUrl ? (
					<Image
						source={{ uri: item.imageUrl }}
						style={{
							width: 112,
							height: 112,
							borderRadius: radius.input,
							backgroundColor: colour.surface
						}}
						contentFit='cover'
						transition={150}
					/>
				) : (
					<View
						style={{
							width: 8,
							height: 90,
							borderRadius: 4,
							backgroundColor: colour.accent
						}}
					/>
				)}
				<View style={styles.rowCopy}>
					<Text
						style={{
							color: colour.accent,
							fontSize: typography.size.caption,
							fontWeight: typography.weight.bold,
							textTransform: 'uppercase',
							letterSpacing: 1
						}}
					>
						{topic} · {formatRelativeTime(item.publishedAt)}
					</Text>
					<Text
						numberOfLines={2}
						style={{
							color: colour.text,
							fontSize: typography.size.subtitle * scale,
							fontWeight: typography.weight.bold,
							lineHeight:
								typography.size.subtitle *
								scale *
								typography.leading.snug,
							marginTop: 5
						}}
					>
						{item.title}
					</Text>
					{item.excerpt ? (
						<Text
							numberOfLines={2}
							style={{
								color: colour.textMuted,
								fontSize: typography.size.small * scale,
								lineHeight:
									typography.size.small *
									scale *
									typography.leading.snug,
								marginTop: 4
							}}
						>
							{item.excerpt}
						</Text>
					) : null}
					<View style={styles.rowMeta}>
						<Text
							numberOfLines={1}
							style={{
								color: colour.textFaint,
								fontSize: typography.size.caption,
								flex: 1
							}}
						>
							{sourceName ?? 'NewzCrime'}
						</Text>
						<Pressable
							accessibilityRole='button'
							accessibilityLabel={
								saved ? 'Remove from saved' : 'Save story'
							}
							hitSlop={10}
							onPress={() => toggle(item)}
						>
							<BookmarkSimpleIcon
								size={20}
								color={saved ? colour.accent : colour.textFaint}
								weight={saved ? 'fill' : 'regular'}
							/>
						</Pressable>
					</View>
				</View>
			</Pressable>
			<View
				style={[
					styles.actions,
					{
						borderTopColor: colour.border,
						marginTop: spacingY.sm,
						paddingTop: spacingY.xs
					}
				]}
			>
				<CardAction
					label={speaking ? 'Stop' : 'Listen'}
					active={speaking}
					icon={
						speaking ? (
							<StopIcon
								size={16}
								color={colour.accent}
								weight='fill'
							/>
						) : (
							<SpeakerHighIcon
								size={16}
								color={colour.textMuted}
							/>
						)
					}
					onPress={() =>
						speaking
							? stop()
							: speak(
									item.id,
									`${item.title}. ${item.excerpt ?? ''}`
								)
					}
				/>
				<CardAction
					label='Share'
					icon={
						<ShareNetworkIcon size={16} color={colour.textMuted} />
					}
					onPress={() => {
						void shareItem(item);
					}}
				/>
				<Text
					style={{
						color: colour.textFaint,
						fontSize: typography.size.caption,
						alignSelf: 'center'
					}}
				>
					{sourceName ?? 'NewzCrime'}
				</Text>
			</View>
		</View>
	);
}
const styles = StyleSheet.create({
	featured: {
		height: 382,
		overflow: 'hidden',
		shadowOpacity: 0.18,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 10 },
		elevation: 5
	},
	featuredPress: { flex: 1, padding: 20, justifyContent: 'space-between' },
	featuredTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	livePill: {
		color: '#fff',
		backgroundColor: '#F15B2A',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 7,
		fontSize: 12,
		fontWeight: '800',
		letterSpacing: 0.7
	},
	location: {
		color: 'rgba(255,255,255,0.9)',
		fontSize: 13,
		fontWeight: '600'
	},
	featuredCopy: { gap: 9 },
	featuredKicker: {
		color: '#FFB28B',
		fontSize: 11,
		fontWeight: '800',
		letterSpacing: 1.5
	},
	featuredTitle: {
		color: '#fff',
		fontWeight: '800',
		lineHeight: 42,
		letterSpacing: -1
	},
	featuredExcerpt: {
		color: 'rgba(255,255,255,0.78)',
		fontSize: 15,
		lineHeight: 21
	},
	featuredMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 2
	},
	featuredMetaText: {
		color: 'rgba(255,255,255,0.75)',
		fontSize: 12,
		flex: 1
	},
	nextCircle: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.25)'
	},
	wrap: {
		padding: 10,
		shadowOpacity: 0.08,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
		elevation: 2
	},
	row: { flexDirection: 'row', gap: 12, padding: 4 },
	rowCopy: { flex: 1, minWidth: 0 },
	rowMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 7
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: 4
	}
});
