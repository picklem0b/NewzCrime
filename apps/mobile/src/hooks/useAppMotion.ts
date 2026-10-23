/**
 * Motion presets, in one place and switchable off.
 *
 * The OS reduce-motion switch and the in-app setting are both respected, and
 * every duration collapses to zero when either is on. Components ask this hook
 * rather than reading `motion` directly so a reader who turns motion off is not
 * left with one animated corner of the app.
 */

import { motion } from '@/constants/theme';

import { useReducedMotion } from './useReducedMotion';
import { useSetting } from './useSettings';

export interface AppMotion {
	/** True when motion should not run at all. */
	reduced: boolean;
	duration: {
		instant: number;
		fast: number;
		base: number;
		slow: number;
	};
	/** Scale a pressed element springs to. */
	pressedScale: number;
	spring: { damping: number; stiffness: number; mass: number };
}

export function useAppMotion(): AppMotion {
	const osReduced = useReducedMotion();
	const settingReduced = useSetting('reduceMotion');
	const reduced = osReduced || settingReduced;

	const scaled = (value: number): number => (reduced ? 0 : value);

	return {
		reduced,
		duration: {
			instant: scaled(motion.duration.instant),
			fast: scaled(motion.duration.fast),
			base: scaled(motion.duration.base),
			slow: scaled(motion.duration.slow)
		},
		pressedScale: motion.scale.pressed,
		spring: motion.spring
	};
}
