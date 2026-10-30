import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import { hapticStrengths } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/**
 * Accessibility: the controls that make the app easier to operate.
 *
 * Reducing motion and raising contrast were in Appearance; they belong here
 * because they are not a style choice. Larger touch targets grow interactive
 * rows and icon buttons to 52dp, and the haptic strength picks the impact
 * style the whole app uses.
 */
export function AccessibilitySection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Accessibility'>
			<ToggleRow
				label='Larger touch targets'
				description='Adds 8dp to buttons, headers and settings rows'
				value={draft.largeTouchTargets}
				onChange={value => apply('largeTouchTargets', value)}
			/>
			<ChoiceRow
				label='Tap feedback strength'
				description='How strong the vibration feels when you press a control'
				options={hapticStrengths}
				value={draft.hapticStrength}
				onChange={value => apply('hapticStrength', value)}
			/>
			<ToggleRow
				label='High contrast'
				description='Stronger borders and muted text'
				value={draft.highContrast}
				onChange={value => apply('highContrast', value)}
			/>
			<ToggleRow
				label='Reduce motion'
				description='Turns off transitions and press animations'
				value={draft.reduceMotion}
				onChange={value => apply('reduceMotion', value)}
				last
			/>
		</SettingGroup>
	);
}

export default AccessibilitySection;
