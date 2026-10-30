import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import { provinceFilters } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/**
 * Local: which province counts as home, and whether it comes first.
 *
 * Province affects the Local shelf and the ordering of Watch. National
 * channels are not hidden when a province is chosen; they simply stop
 * outranking a story that mentions the reader's province.
 */
export function LocalSection(): ReactElement {
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Local'>
			<ChoiceRow
				label='Your province'
				description='Used by the Local shelf and by Watch ordering'
				options={provinceFilters}
				value={draft.province}
				onChange={value => apply('province', value)}
			/>
			<ToggleRow
				label='Put local first'
				description='Raises provincial and city updates above national video'
				value={draft.localFirst}
				onChange={value => apply('localFirst', value)}
				last
			/>
		</SettingGroup>
	);
}

export default LocalSection;
