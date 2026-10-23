/**
 * Springy press feedback, shared by the controls that should feel tactile.
 *
 * The scale lives in native code and collapses to a no-op when motion is
 * reduced, so it costs nothing on the screens that animate and never fights a
 * reader who asked for stillness.
 */

import { useRef } from 'react';
import { Animated } from 'react-native';

import { useAppMotion } from './useAppMotion';

export function usePressScale() {
	const motion = useAppMotion();
	const scale = useRef(new Animated.Value(1)).current;

	const springTo = (toValue: number) => {
		if (motion.reduced) {
			scale.setValue(1);
			return;
		}

		Animated.spring(scale, {
			toValue,
			useNativeDriver: true,
			damping: motion.spring.damping,
			stiffness: motion.spring.stiffness,
			mass: motion.spring.mass
		}).start();
	};

	return {
		scale,
		onPressIn: () => springTo(motion.pressedScale),
		onPressOut: () => springTo(1)
	};
}
