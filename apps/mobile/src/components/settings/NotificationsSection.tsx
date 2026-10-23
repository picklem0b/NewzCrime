import type { ReactElement } from 'react';
import { View } from 'react-native';

import { ChoiceRow, SettingGroup, ToggleRow } from '@/components/settings/SettingRow';
import Text from '@/components/ui/Text';
import { briefingTimes, quietHoursOptions } from '@/constants/settings';
import { useApplySetting } from '@/hooks/useApplySetting';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';

/**
 * Notifications: which alerts are wanted, and when they may arrive.
 *
 * Quiet hours are stored as one of two named windows rather than a pair of
 * time pickers. That keeps the setting a single tap, and `shouldNotify` can
 * answer "is this a reasonable hour" with a pure function the tests pin.
 */
export function NotificationsSection(): ReactElement {
	const { colour, spacing } = useTheme();
	const { draft } = useSettings();
	const apply = useApplySetting();

	return (
		<SettingGroup title='Notifications'>
			<ToggleRow
				label='Breaking news'
				description='Major stories as they are published'
				value={draft.breakingNews}
				onChange={value => apply('breakingNews', value)}
			/>
			<ToggleRow
				label='New episodes'
				description='When a show you follow releases an episode'
				value={draft.podcastNotifications}
				onChange={value => apply('podcastNotifications', value)}
			/>
			<ToggleRow
				label='Daily briefing'
				description='One summary of the day, at the time below'
				value={draft.dailyBriefing}
				onChange={value => apply('dailyBriefing', value)}
			/>
			<ChoiceRow
				label='Briefing time'
				description='When the daily summary is sent'
				options={briefingTimes}
				value={draft.briefingTime}
				onChange={value => apply('briefingTime', value)}
			/>
			<ChoiceRow
				label='Quiet hours'
				description='Alerts are held until the window ends'
				options={quietHoursOptions}
				value={draft.quietHours}
				onChange={value => apply('quietHours', value)}
			/>
			<ToggleRow
				label='Court ruling alerts'
				description='New judgments from the courts you follow'
				value={draft.courtRulings}
				onChange={value => apply('courtRulings', value)}
			/>
			<ToggleRow
				label='Saved outlets'
				description='Only alert for outlets in your library'
				value={draft.savedOutlets}
				onChange={value => apply('savedOutlets', value)}
			/>
			<ToggleRow
				label='Sound'
				description='Play the alert tone'
				value={draft.soundAlerts}
				onChange={value => apply('soundAlerts', value)}
			/>
			<ToggleRow
				label='Vibration'
				description='Vibrate with an alert'
				value={draft.vibrateAlerts}
				onChange={value => apply('vibrateAlerts', value)}
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
					Alerts are delivered on this device. Quiet hours hold them until
					the window ends rather than discarding them.
				</Text>
			</View>
		</SettingGroup>
	);
}

export default NotificationsSection;
