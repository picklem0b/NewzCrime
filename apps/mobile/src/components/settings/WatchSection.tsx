import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import { watchStartTabs } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/** Watch: the shelf the tab opens on and how much context a video shows. */
export function WatchSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Watch'>
			<ChoiceRow
				label='Open on'
				description='The shelf Watch starts with'
				options={watchStartTabs}
				value={draft.watchStartTab}
				onChange={value => apply('watchStartTab', value)}
			/>
			<ToggleRow
				label='Show video descriptions'
				description='Expands the description under the player by default'
				value={draft.showVideoDescriptions}
				onChange={value => apply('showVideoDescriptions', value)}
				last
			/>
		</SettingGroup>
	);
}

export default WatchSection;
