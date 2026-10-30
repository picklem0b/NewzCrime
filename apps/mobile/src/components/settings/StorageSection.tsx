import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Alert, View } from 'react-native';

import { ChoiceRow, SettingGroup, SettingRow, ToggleRow } from '@/components/settings/SettingRow';
import Text from '@/components/ui/Text';
import { thumbnailQualities } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { clearFeedCache } from '@/services/feedCache';
import { cacheEntryCount, clearCache } from '@/utils/cache';

/**
 * Storage: what the app keeps on the device and how much network it spends.
 *
 * Clearing removes the response cache and cached feed snapshots, never saved
 * stories or settings. The thumbnail quality control is deliberately separate
 * from the global data saver: a reader on Wi-Fi may still want smaller video
 * cards without turning off artwork elsewhere.
 */
export function StorageSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();
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
		<SettingGroup title='Storage'>
			<ChoiceRow
				label='Thumbnail quality'
				description='Data saver asks YouTube for smaller video cards'
				options={thumbnailQualities}
				value={draft.thumbnailQuality}
				onChange={value => apply('thumbnailQuality', value)}
			/>
			<ToggleRow
				label='Download over Wi-Fi only'
				description='Queues audio until a Wi-Fi network is available'
				value={draft.downloadOnWifi}
				onChange={value => apply('downloadOnWifi', value)}
			/>
			<ToggleRow
				label='Data saver'
				description='Loads smaller images and skips autoplay previews'
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
					Video is streamed by YouTube and is not downloaded by NewzCrime.
					Clearing the cache does not sign you out or remove subscriptions.
				</Text>
			</View>
		</SettingGroup>
	);
}

export default StorageSection;
