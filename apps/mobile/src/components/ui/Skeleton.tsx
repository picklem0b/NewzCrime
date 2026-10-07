import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { Animated } from 'react-native';
import type { DimensionValue } from 'react-native';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/hooks/useTheme';

export interface SkeletonProps {
	width: DimensionValue;
	height: number;
	rounded?: 'sm' | 'md';
}

export function Skeleton({
	width,
	height,
	rounded = 'sm'
}: SkeletonProps): ReactElement {
	const { colour, motion, radius } = useTheme();
	const reduced = useReducedMotion();
	const opacity = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (reduced) {
			opacity.setValue(1);
			return undefined;
		}

		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 0.55,
					duration: motion.duration.pulse,
					useNativeDriver: true
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: motion.duration.pulse,
					useNativeDriver: true
				})
			])
		);
		loop.start();

		return () => loop.stop();
	}, [reduced, opacity, motion.duration.pulse]);

	return (
		<Animated.View
			style={{
				width,
				height,
				opacity,
				borderRadius: radius[rounded],
				backgroundColor: colour.skeleton
			}}
		/>
	);
}

export default Skeleton;
