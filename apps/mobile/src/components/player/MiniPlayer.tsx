import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { PauseIcon, PlayIcon, XIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePlayer } from '@/hooks/usePlayer';
import { useTheme } from '@/hooks/useTheme';
export interface MiniPlayerProps {
	onOpen: () => void;
}
export function MiniPlayer({ onOpen }: MiniPlayerProps): ReactElement | null {
	const { colour, scheme, radius, spacingX, typography } = useTheme();
	const { current, status, toggle, stop } = usePlayer();
	if (!current) return null;
	return (
		<View style={[styles.shell, { shadowColor: '#000' }]}>
			<BlurView
				intensity={scheme === 'light' ? 85 : 65}
				tint={scheme}
				style={StyleSheet.absoluteFill}
			/>
			<View
				style={[
					StyleSheet.absoluteFill,
					{
						backgroundColor:
							scheme === 'light'
								? 'rgba(255,255,255,0.82)'
								: 'rgba(22,26,31,0.88)',
						borderColor: colour.border,
						borderRadius: radius.pill,
						borderWidth: 1
					}
				]}
			/>
			<View style={[styles.content, { paddingHorizontal: spacingX.md }]}>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel='Open player'
					onPress={onOpen}
					style={styles.details}
				>
					{current.imageUrl ? (
						<Image
							source={{ uri: current.imageUrl }}
							style={{
								width: 34,
								height: 34,
								borderRadius: 17,
								backgroundColor: colour.surface
							}}
							contentFit='cover'
						/>
					) : (
						<View
							style={{
								width: 34,
								height: 34,
								borderRadius: 17,
								backgroundColor: colour.accent
							}}
						/>
					)}
					<View style={{ flex: 1, marginLeft: spacingX.sm }}>
						<Text
							numberOfLines={1}
							style={{
								color: colour.text,
								fontSize: typography.size.small,
								fontWeight: typography.weight.semibold
							}}
						>
							{current.title}
						</Text>
						<Text
							style={{
								color: colour.accent,
								fontSize: 10,
								fontWeight: typography.weight.bold,
								letterSpacing: 0.8,
								textTransform: 'uppercase'
							}}
						>
							{status === 'playing' ? 'Playing now' : 'Paused'}
						</Text>
					</View>
				</Pressable>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel={status === 'playing' ? 'Pause' : 'Play'}
					onPress={() => {
						void toggle();
					}}
					style={[
						styles.control,
						{ backgroundColor: colour.primary }
					]}
				>
					{status === 'playing' ? (
						<PauseIcon
							size={17}
							color={colour.onPrimary}
							weight='fill'
						/>
					) : (
						<PlayIcon
							size={17}
							color={colour.onPrimary}
							weight='fill'
						/>
					)}
				</Pressable>
				<Pressable
					accessibilityRole='button'
					accessibilityLabel='Close player'
					onPress={() => {
						void stop();
					}}
					hitSlop={8}
				>
					<XIcon size={18} color={colour.textMuted} />
				</Pressable>
			</View>
		</View>
	);
}
const styles = StyleSheet.create({
	shell: {
		position: 'absolute',
		left: 16,
		right: 16,
		bottom: 88,
		height: 62,
		borderRadius: 999,
		overflow: 'hidden',
		shadowOpacity: 0.2,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8
	},
	content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
	details: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		minWidth: 0
	},
	control: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
export default MiniPlayer;
