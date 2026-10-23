import type { ReactElement } from 'react';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import { defaultTopics, refreshIntervals, startTabs } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';

/**
 * General: where the app starts and how it behaves while browsing.
 *
 * Refresh is split into a switch and an interval so turning it off does not
 * lose the reader's chosen cadence — switch it back on and the interval is
 * still there.
 */
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
			/>
			<ChoiceRow
				label='Default topic'
				description='The filter Today opens with'
				options={defaultTopics}
				value={draft.defaultTopic}
				onChange={value => apply('defaultTopic', value)}
			/>
			<ChoiceRow
				label='Refresh interval'
				description='How often Today checks for new stories'
				options={refreshIntervals}
				value={draft.refreshInterval}
				onChange={value => apply('refreshInterval', value)}
			/>
			<ToggleRow
				label='Refresh automatically'
				description='Checks the feed while you are reading'
				value={draft.autoRefresh}
				onChange={value => apply('autoRefresh', value)}
			/>
			<ToggleRow
				label='Haptics'
				description='A light tap when a control is pressed'
				value={draft.haptics}
				onChange={value => apply('haptics', value)}
			/>
			<ToggleRow
				label='Open links in the app'
				description='Off sends publisher pages to your browser'
				value={draft.openLinksInApp}
				onChange={value => apply('openLinksInApp', value)}
			/>
			<ToggleRow
				label='Show the mini player'
				description='Keeps the current episode above the tab bar'
				value={draft.showMiniPlayer}
				onChange={value => apply('showMiniPlayer', value)}
			/>
			<ToggleRow
				label='Confirm before clearing'
				description='Asks first when emptying the library'
				value={draft.confirmBeforeClearing}
				onChange={value => apply('confirmBeforeClearing', value)}
				last
			/>
		</SettingGroup>
	);
}

export default GeneralSection;
