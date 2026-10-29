import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';

import Text from '@/components/ui/Text';
import { brand, onboardingTheme } from '@/constants/theme';

const {
	gradient: GRADIENT,
	paper: PAPER,
	root: ROOT,
	swirlWarm: SWIRL_WARM,
	swirlDeep: SWIRL_DEEP,
	slogan: SLOGAN,
	spinner: SPINNER,
	mark: MARK,
	markBorder: MARK_BORDER
} = onboardingTheme;

/**
 * What the reader sees between the native splash and the tab they open on.
 *
 * It exists to cover the synchronous work the first screen depends on: reading
 * the settings and moving yesterday's feed from disk into memory. Without it
 * that work happens after the first paint, which is how a skeleton reaches the
 * screen for one frame.
 */
export function BootSplash(): ReactElement {
	const { width, height } = useWindowDimensions();

	return (
		<View style={styles.root}>
			<LinearGradient
				colors={GRADIENT}
				start={{ x: 0.05, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFill}
			/>
			<View
				pointerEvents='none'
				style={[
					styles.swirl,
					{
						width: width * 1.2,
						height: width * 1.2,
						borderRadius: width * 0.6,
						top: -width * 0.58,
						right: -width * 0.38,
						backgroundColor: SWIRL_WARM
					}
				]}
			/>
			<View
				pointerEvents='none'
				style={[
					styles.swirl,
					{
						width: width * 0.95,
						height: width * 0.95,
						borderRadius: width * 0.475,
						bottom: -height * 0.16,
						left: -width * 0.3,
						backgroundColor: SWIRL_DEEP
					}
				]}
			/>

			<View style={styles.content}>
				<View style={styles.mark}>
					<Text variant='display' style={{ color: PAPER }}>
						N
					</Text>
				</View>
				<Text variant='h1' style={{ color: PAPER }}>
					{brand.name}
				</Text>
				<Text variant='small' style={styles.slogan}>
					{brand.slogan}
				</Text>
			</View>

			<ActivityIndicator color={SPINNER} style={styles.spinner} />
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		backgroundColor: ROOT
	},
	swirl: { position: 'absolute' },
	content: { alignItems: 'center', gap: 8 },
	mark: {
		width: 76,
		height: 76,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: MARK,
		borderWidth: 1,
		borderColor: MARK_BORDER,
		marginBottom: 8
	},
	slogan: { color: SLOGAN },
	spinner: { position: 'absolute', bottom: 72 }
});

export default BootSplash;
