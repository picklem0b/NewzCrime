import { ArrowLeftIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
export interface ScreenHeaderProps {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	actions?: ReactNode;
	eyebrow?: string;
}
export function ScreenHeader({
	title,
	subtitle,
	onBack,
	actions,
	eyebrow
}: ScreenHeaderProps): ReactElement {
	const { colour, spacingX, spacingY, typography } = useTheme();
	return (
		<View
			style={[
				styles.container,
				{
					paddingHorizontal: spacingX.lg,
					paddingTop: spacingY.lg,
					paddingBottom: spacingY.md
				}
			]}
		>
			<View style={styles.leading}>
				{onBack ? (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel='Go back'
						onPress={onBack}
						style={[
							styles.backButton,
							{ backgroundColor: colour.surface }
						]}
					>
						<ArrowLeftIcon
							size={20}
							color={colour.text}
							weight='bold'
						/>
					</Pressable>
				) : null}
				<View style={styles.titles}>
					{eyebrow ? (
						<Text
							style={{
								color: colour.accent,
								fontSize: typography.size.caption,
								fontWeight: typography.weight.bold,
								letterSpacing: 1.2,
								textTransform: 'uppercase'
							}}
						>
							{eyebrow}
						</Text>
					) : null}
					<Text
						numberOfLines={1}
						style={{
							color: colour.text,
							fontSize: typography.size.heading,
							fontWeight: typography.weight.bold,
							letterSpacing: -0.7
						}}
					>
						{title}
					</Text>
					{subtitle ? (
						<Text
							numberOfLines={1}
							style={{
								color: colour.textMuted,
								fontSize: typography.size.small,
								marginTop: 3
							}}
						>
							{subtitle}
						</Text>
					) : null}
				</View>
			</View>
			{actions ? <View style={styles.actions}>{actions}</View> : null}
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12
	},
	leading: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
	backButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center'
	},
	titles: { flex: 1 },
	actions: { flexDirection: 'row', alignItems: 'center', gap: 8 }
});
export default ScreenHeader;
