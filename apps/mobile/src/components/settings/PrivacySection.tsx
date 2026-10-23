import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Alert, View } from 'react-native';

import { SettingGroup, SettingRow, ToggleRow } from '@/components/settings/SettingRow';
import Text from '@/components/ui/Text';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { clearFeedCache } from '@/services/feedCache';
import { useRecentSearchesStore } from '@/stores/search.store';
import { cacheEntryCount, clearCache } from '@/utils/cache';

/**
 * Data and privacy: what leaves the device, and what is kept on it.
 *
 * Analytics is off by default and crash reports are on, which is the useful
 * split: a crash report is a bug, an analytics event is a profile. Clearing
 * cached data removes only the response cache — settings and bookmarks are
 * stored elsewhere and are not touched.
 */
export function PrivacySection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();
	const clearTerms = useRecentSearchesStore(state => state.clear);
	const [entries, setEntries] = useState<number | null>(null);

	useEffect(() => {
		void cacheEntryCount().then(setEntries);
	}, []);

	const confirmClear = (): void => {
		Alert.alert(
			'Clear cached data?',
			'Saved stories and your settings stay. Cached feeds and images are fetched again next time.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear',
					style: 'destructive',
					onPress: () => {
						void Promise.all([clearCache(), clearFeedCache()]).then(() =>
							setEntries(0)
						);
					}
				}
			]
		);
	};

	return (
		<SettingGroup title='Data & privacy'>
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
			/>
			<ToggleRow
				label='Download over Wi-Fi only'
				description='Queues audio until a Wi-Fi network is available'
				value={draft.downloadOnWifi}
				onChange={value => apply('downloadOnWifi', value)}
			/>
			<ToggleRow
				label='Data saver'
				description='Loads smaller images and skips autoplay'
				value={draft.dataSaver}
				onChange={value => apply('dataSaver', value)}
			/>
			<ToggleRow
				label='Keep images offline'
				description='Caches artwork so lists render without a network'
				value={draft.offlineImages}
				onChange={value => apply('offlineImages', value)}
			/>
			<ToggleRow
				label='Clear cache on exit'
				description='Empties the response cache when the app closes'
				value={draft.clearCacheOnExit}
				onChange={value => apply('clearCacheOnExit', value)}
			/>
			<SettingRow
				label='Clear cached data'
				description='Settings and saved stories are kept'
				value={entries === null ? '…' : `${entries} saved`}
				onPress={confirmClear}
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
