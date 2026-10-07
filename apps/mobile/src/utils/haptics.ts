import * as Haptics from 'expo-haptics';

export function tapFeedback(): void {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
		() => undefined
	);
}
