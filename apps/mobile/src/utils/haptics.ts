import * as Haptics from 'expo-haptics';

import { readSettings } from '@/stores/settings.store';

/**
 * Light tap feedback, unless the reader turned it off.
 *
 * Read from the committed settings rather than through a hook so utilities can
 * call it; the store is a module singleton and this stays a cheap read.
 */
export function tapFeedback(): void {
	if (!readSettings().haptics) return;

	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
		() => undefined
	);
}
