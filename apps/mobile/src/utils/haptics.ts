import * as Haptics from 'expo-haptics';

import { readSettings } from '@/stores/settings.store';
import type { HapticStrength } from '@/types';

const impactStyle: Record<HapticStrength, Haptics.ImpactFeedbackStyle> = {
	light: Haptics.ImpactFeedbackStyle.Light,
	medium: Haptics.ImpactFeedbackStyle.Medium,
	strong: Haptics.ImpactFeedbackStyle.Heavy
};

/**
 * Tap feedback at the reader's chosen strength, unless they turned it off.
 *
 * Read from the committed settings rather than through a hook so utilities can
 * call it; the store is a module singleton and this stays a cheap read.
 */
export function tapFeedback(): void {
	const settings = readSettings();
	if (!settings.haptics) return;

	Haptics.impactAsync(impactStyle[settings.hapticStrength]).catch(
		() => undefined
	);
}
