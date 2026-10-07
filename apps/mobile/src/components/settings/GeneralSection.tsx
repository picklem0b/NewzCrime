import type { ReactElement } from 'react';

import { useSettings } from '@/hooks/useSettings';
import { ChoiceRow, SettingGroup } from '@/components/settings/SettingRow';
import { startTabs } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';

export function GeneralSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='General'>
			<ChoiceRow
				label='Open on'
				description='Which tab the app starts on'
				options={startTabs}
				value={draft.startTab}
				onChange={value => apply('startTab', value)}
				last
			/>
		</SettingGroup>
	);
}

export default GeneralSection;
