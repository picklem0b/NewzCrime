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
	const { colour, onImage, radius, shadowColour, spacingY, typography } =
		useTheme();
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
						shadowColor: shadowColour
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
						colors={onImage.scrim}
						locations={[0.2, 1]}
						style={StyleSheet.absoluteFill}
					/>
					<View style={styles.featuredCopy}>
						<Text
							style={[styles.featuredKicker, { color: onImage.kicker }]}
						>
							TOP STORY · {topic.toUpperCase()}
						</Text>
						<Text
							style={[
								styles.featuredTitle,
								{
									color: onImage.text,
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
								style={[
									styles.featuredExcerpt,
									{ color: onImage.textMuted }
								]}
							>
								{item.excerpt}
							</Text>
						) : null}
						<View style={styles.featuredMeta}>
							<Text
								style={[
									styles.featuredMetaText,
									{ color: onImage.textFaint }
								]}
							>
								{formatRelativeTime(item.publishedAt)} ·{' '}
								{sourceName ?? 'NewzCrime'}
							</Text>
							<View
								style={[
									styles.nextCircle,
									{
										backgroundColor: onImage.control,
										borderColor: onImage.controlBorder
									}
								]}
							>
								<CaretRightIcon
									size={22}
									color={onImage.text}
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
					shadowColor: shadowColour
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
	featuredPress: { flex: 1, padding: 20, justifyContent: 'flex-end' },
	featuredCopy: { gap: 9 },
	featuredKicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
	featuredTitle: { fontWeight: '800', lineHeight: 42, letterSpacing: -1 },
	featuredExcerpt: { fontSize: 15, lineHeight: 21 },
	featuredMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 2
	},
	featuredMetaText: { fontSize: 12, flex: 1 },
	nextCircle: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1
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
