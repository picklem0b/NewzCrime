import { BlurView } from 'expo-blur';
import {
	BellIcon,
	BookmarkSimpleIcon,
	CheckCircleIcon,
	GearSixIcon,
	PlayCircleIcon,
	QuestionIcon,
	SunIcon,
	UserCircleIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import AppSection from '@/settings/sections/AppSection';
import AppearanceSection from '@/settings/sections/AppearanceSection';
function IconTile({
	icon,
	colour
}: {
	icon: ReactElement;
	colour: string;
}): ReactElement {
	return (
		<View
			style={{
				width: 38,
				height: 38,
				borderRadius: 19,
				backgroundColor: `${colour}22`,
				alignItems: 'center',
				justifyContent: 'center'
			}}
		>
			{icon}
		</View>
	);
}
function Group({
	title,
	children
}: {
	title: string;
	children: ReactElement;
}): ReactElement {
	const { colour, spacingY, typography } = useTheme();
	return (
		<View style={{ gap: spacingY.sm }}>
			<Text
				style={{
					color: colour.textFaint,
					fontSize: typography.size.caption,
					fontWeight: typography.weight.bold,
					letterSpacing: 1.2,
					textTransform: 'uppercase',
					paddingHorizontal: 4
				}}
			>
				{title}
			</Text>
			{children}
		</View>
	);
}
export default function SettingsScreen(): ReactElement {
	const { colour, scheme, radius, spacingX, spacingY, typography } =
		useTheme();
	const { changed, save, discard } = useSettings();
	return (
		<View style={styles.fill}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 140, gap: spacingY.xl }}
			>
				<View
					style={{
						height: 190,
						overflow: 'hidden',
						backgroundColor: colour.surface
					}}
				>
					<BlurView
						intensity={scheme === 'light' ? 55 : 25}
						tint={scheme}
						style={StyleSheet.absoluteFill}
					/>
					<View
						style={{
							flex: 1,
							paddingHorizontal: spacingX.lg,
							paddingTop: spacingY.xl,
							justifyContent: 'flex-end',
							paddingBottom: spacingY.lg
						}}
					>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: 14
							}}
						>
							<View
								style={{
									width: 66,
									height: 66,
									borderRadius: 33,
									backgroundColor: colour.primary,
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<Text
									style={{
										color: colour.onPrimary,
										fontSize: 24,
										fontWeight: '800'
									}}
								>
									NC
								</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text
									style={{
										color: colour.text,
										fontSize: typography.size.title,
										fontWeight: typography.weight.bold
									}}
								>
									NewzCrime Reader
								</Text>
								<Text
									style={{
										color: colour.textMuted,
										fontSize: typography.size.small,
										marginTop: 3
									}}
								>
									Stay informed. Stay safer.
								</Text>
							</View>
							<Pressable
								accessibilityRole='button'
								accessibilityLabel='Edit profile'
								style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: colour.surfaceRaised,
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								<UserCircleIcon
									size={21}
									color={colour.accent}
								/>
							</Pressable>
						</View>
					</View>
				</View>
				<View
					style={{ paddingHorizontal: spacingX.lg, gap: spacingY.xl }}
				>
					<View
						style={[
							styles.quickCard,
							{
								backgroundColor: colour.surfaceRaised,
								borderColor: colour.border,
								borderRadius: radius.card
							}
						]}
					>
						<IconTile
							colour={colour.accent}
							icon={
								<BookmarkSimpleIcon
									size={20}
									color={colour.accent}
									weight='fill'
								/>
							}
						/>
						<View style={{ flex: 1, marginLeft: spacingX.md }}>
							<Text
								style={{
									color: colour.text,
									fontSize: typography.size.body,
									fontWeight: typography.weight.semibold
								}}
							>
								Your reading space
							</Text>
							<Text
								style={{
									color: colour.textMuted,
									fontSize: typography.size.caption,
									marginTop: 3
								}}
							>
								Saved stories and listening history live here.
							</Text>
						</View>
						<CheckCircleIcon
							size={22}
							color={colour.success}
							weight='fill'
						/>
					</View>
					<Group
						title='Personalize'
						children={
							<View style={{ gap: spacingY.sm }}>
								<View
									style={[
										styles.sectionCard,
										{
											backgroundColor: colour.surface,
											borderColor: colour.border,
											borderRadius: radius.card
										}
									]}
								>
									<View style={styles.sectionHeading}>
										<IconTile
											colour={colour.accent}
											icon={
												<SunIcon
													size={19}
													color={colour.accent}
													weight='fill'
												/>
											}
										/>
										<Text
											style={[
												styles.sectionTitle,
												{ color: colour.text }
											]}
										>
											Appearance
										</Text>
									</View>
									<AppearanceSection />
								</View>
							</View>
						}
					/>
					<Group
						title='Stay in the loop'
						children={
							<View
								style={[
									styles.sectionCard,
									{
										backgroundColor: colour.surface,
										borderColor: colour.border,
										borderRadius: radius.card
									}
								]}
							>
								<View style={styles.sectionHeading}>
									<IconTile
										colour={colour.accent}
										icon={
											<BellIcon
												size={19}
												color={colour.accent}
												weight='fill'
											/>
										}
									/>
									<Text
										style={[
											styles.sectionTitle,
											{ color: colour.text }
										]}
									>
										Alerts and playback
									</Text>
								</View>
								<AppSection />
							</View>
						}
					/>
					<Group
						title='Support'
						children={
							<View
								style={[
									styles.sectionCard,
									{
										backgroundColor: colour.surface,
										borderColor: colour.border,
										borderRadius: radius.card
									}
								]}
							>
								<View style={styles.supportRow}>
									<IconTile
										colour={colour.textMuted}
										icon={
											<QuestionIcon
												size={19}
												color={colour.textMuted}
											/>
										}
									/>
									<View
										style={{
											flex: 1,
											marginLeft: spacingX.md
										}}
									>
										<Text
											style={{
												color: colour.text,
												fontSize: typography.size.body,
												fontWeight:
													typography.weight.semibold
											}}
										>
											Help & support
										</Text>
										<Text
											style={{
												color: colour.textMuted,
												fontSize:
													typography.size.caption,
												marginTop: 2
											}}
										>
											Get help with NewzCrime
										</Text>
									</View>
									<GearSixIcon
										size={20}
										color={colour.textFaint}
									/>
								</View>
								<View
									style={[
										styles.supportRow,
										{
											borderTopWidth:
												StyleSheet.hairlineWidth,
											borderTopColor: colour.border
										}
									]}
								>
									<IconTile
										colour={colour.textMuted}
										icon={
											<PlayCircleIcon
												size={19}
												color={colour.textMuted}
											/>
										}
									/>
									<View
										style={{
											flex: 1,
											marginLeft: spacingX.md
										}}
									>
										<Text
											style={{
												color: colour.text,
												fontSize: typography.size.body,
												fontWeight:
													typography.weight.semibold
											}}
										>
											About NewzCrime
										</Text>
										<Text
											style={{
												color: colour.textMuted,
												fontSize:
													typography.size.caption,
												marginTop: 2
											}}
										>
											Version and release notes
										</Text>
									</View>
									<Text
										style={{
											color: colour.textFaint,
											fontSize: typography.size.small
										}}
									>
										›
									</Text>
								</View>
							</View>
						}
					/>
					<Text
						style={{
							color: colour.textFaint,
							fontSize: typography.size.caption,
							textAlign: 'center',
							marginTop: spacingY.sm
						}}
					>
						NewzCrime · Keeping you updated.
					</Text>
				</View>
			</ScrollView>
			{changed.length > 0 ? (
				<View
					style={[
						styles.saveBar,
						{
							backgroundColor:
								scheme === 'light'
									? 'rgba(255,255,255,0.92)'
									: 'rgba(22,26,31,0.95)',
							borderColor: colour.border
						}
					]}
				>
					<Pressable accessibilityRole='button' onPress={discard}>
						<Text
							style={{
								color: colour.textMuted,
								fontSize: typography.size.small
							}}
						>
							Discard
						</Text>
					</Pressable>
					<Pressable
						accessibilityRole='button'
						onPress={save}
						style={{
							backgroundColor: colour.primary,
							borderRadius: radius.pill,
							paddingHorizontal: spacingX.xl,
							paddingVertical: spacingY.md
						}}
					>
						<Text
							style={{
								color: colour.onPrimary,
								fontSize: typography.size.small,
								fontWeight: typography.weight.bold
							}}
						>
							Save changes
						</Text>
					</Pressable>
				</View>
			) : null}
		</View>
	);
}
const styles = StyleSheet.create({
	fill: { flex: 1 },
	quickCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 14,
		borderWidth: StyleSheet.hairlineWidth
	},
	sectionCard: {
		padding: 14,
		borderWidth: StyleSheet.hairlineWidth,
		gap: 12
	},
	sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	sectionTitle: { fontSize: 17, fontWeight: '700' },
	supportRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		minHeight: 62
	},
	saveBar: {
		position: 'absolute',
		left: 16,
		right: 16,
		bottom: 88,
		borderRadius: 999,
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 18,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8
	}
});
