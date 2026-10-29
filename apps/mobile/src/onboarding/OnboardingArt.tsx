import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { onboardingTheme } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';

import type { FloatingIcon, OnboardingSlide } from './slides';

const {
	iconInk: ICON_INK,
	paper: PAPER,
	glow: GLOW,
	glowBorder: GLOW_BORDER,
	discBorder: DISC_BORDER,
	shadow: SHADOW,
	orbit: ORBIT,
	orbitBorder: ORBIT_BORDER
} = onboardingTheme;

type OrbitIconProps = FloatingIcon;

/**
 * One icon in orbit around the disc.
 *
 * The float is deliberately small and slow. Six independent loops at full
 * amplitude read as a shaking screen; a few dp at different speeds reads as
 * movement. Any reduced-motion setting freezes them in place.
 */
function OrbitIcon({
	Icon,
	size,
	placement,
	drift,
	duration
}: OrbitIconProps): ReactElement {
	const { reduced } = useAppMotion();
	const translateY = useRef(new Animated.Value(drift)).current;
	const padding = Math.max(7, Math.round(size * 0.34));

	useEffect(() => {
		if (reduced) {
			translateY.setValue(drift);
			return undefined;
		}

		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(translateY, {
					toValue: drift - 7,
					duration,
					useNativeDriver: true
				}),
				Animated.timing(translateY, {
					toValue: drift + 4,
					duration,
					useNativeDriver: true
				})
			])
		);

		loop.start();
		return () => loop.stop();
	}, [drift, duration, reduced, translateY]);

	return (
		<Animated.View
			pointerEvents='none'
			style={[
				styles.orbit,
				placement,
				{ padding, transform: [{ translateY }] }
			]}
		>
			<Icon size={size} color={ICON_INK} weight='duotone' />
		</Animated.View>
	);
}

export interface OnboardingArtProps {
	slide: OnboardingSlide;
	/** Diameter of the cream disc, in dp. */
	size: number;
}

/**
 * The illustration and its satellites.
 *
 * The stage only reserves the disc and a little breathing room, so the orbit
 * icons can hang outside it. The whole component is `pointerEvents="none"`:
 * the page belongs to the horizontal pager, and an icon must never eat a swipe.
 */
export function OnboardingArt({
	slide,
	size
}: OnboardingArtProps): ReactElement {
	const stage = size + 48;

	return (
		<View
			pointerEvents='none'
			style={[styles.stage, { width: stage, height: stage }]}
		>
			<View
				style={[
					styles.glow,
					{
						width: size + 54,
						height: size + 54,
						borderRadius: (size + 54) / 2
					}
				]}
			/>

			<View
				style={[
					styles.disc,
					{ width: size, height: size, borderRadius: size / 2 }
				]}
			>
				<Image
					source={slide.art}
					style={{ width: size * 0.84, height: size * 0.84 }}
					contentFit='contain'
					accessible
					accessibilityLabel={slide.artLabel}
					cachePolicy='memory-disk'
					transition={180}
				/>
			</View>

			{slide.icons.map((icon, index) => (
				<OrbitIcon key={`${slide.id}-${index}`} {...icon} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	stage: { alignItems: 'center', justifyContent: 'center' },
	glow: {
		position: 'absolute',
		backgroundColor: GLOW,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: GLOW_BORDER
	},
	disc: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: PAPER,
		borderWidth: 1,
		borderColor: DISC_BORDER,
		shadowColor: SHADOW,
		shadowOpacity: 0.28,
		shadowRadius: 22,
		shadowOffset: { width: 0, height: 12 },
		elevation: 10
	},
	orbit: {
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 999,
		backgroundColor: ORBIT,
		borderWidth: 1,
		borderColor: ORBIT_BORDER
	}
});

export default OnboardingArt;
