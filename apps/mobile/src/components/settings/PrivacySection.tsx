import type { ReactElement } from 'react';
import { View } from 'react-native';

import { SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import Text from '@/components/ui/Text';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useRecentSearchesStore } from '@/stores/search.store';

/**
 * Data and privacy: what leaves the device, and what is remembered.
 *
 * Saving and cache controls moved to Storage, so this section answers one
 * question only: which data is shared. Analytics is off by default and crash
 * reports are on, which is the useful split: a crash report is a bug, an
 * analytics event is a profile.
 */
export function PrivacySection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();
	const clearTerms = useRecentSearchesStore(state => state.clear);

	return (
		<SettingGroup title='Privacy'>
			<ToggleRow
				label='Anonymous analytics'
				description='Off by default; counts screen visits only'
				value={draft.analytics}
				onChange={value => apply('analytics', value)}
			/>
			<ToggleRow
				label='Crash reports'
				description='Sends the stack trace when the app fails'
				value={draft.crashReports}
				onChange={value => apply('crashReports', value)}
			/>
			<ToggleRow
				label='Personalise the feed'
				description='Reorders stories using what you read'
				value={draft.personaliseFeed}
				onChange={value => apply('personaliseFeed', value)}
			/>
			<ToggleRow
				label='Keep search history'
				description='Remembers recent searches on this device'
				value={draft.keepHistory}
				onChange={value => {
					apply('keepHistory', value);
					if (!value) clearTerms();
				}}
				last
			/>
			<View
				style={{
					padding: spacing.lg,
					borderTopWidth: 1,
					borderTopColor: colour.border
				}}
			>
				<Text variant='meta' tone='faint'>
					NewzCrime links to publishers. Reading a story in the app does not
					share your identity with the outlet.
				</Text>
			</View>
		</SettingGroup>
	);
}

export default PrivacySection;
