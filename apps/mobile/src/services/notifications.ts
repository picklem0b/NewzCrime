/**
 * Local notifications, kept deliberately small.
 *
 * Everything here is best-effort: a reader who declined the permission, a
 * platform without notifications, or an Expo Go build without the module must
 * still get the in-app banner. Nothing in this file throws to its caller.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { readSettings } from '@/stores/settings.store';
import { shouldNotify } from '@/utils/notifications';

const supported = Platform.OS !== 'web';

if (supported) {
	Notifications.setNotificationHandler({
		handleNotification: async () => {
			const settings = readSettings();
			return {
				shouldShowAlert: true,
				shouldPlaySound: settings.soundAlerts,
				shouldSetBadge: false
			};
		}
	});
}

export const UPDATE_NOTIFICATION_ID = 'newzcrime.update-available';

async function ensurePermission(): Promise<boolean> {
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;

	const asked = await Notifications.requestPermissionsAsync();
	return asked.granted;
}

/** Tells the reader an update is ready, when notifications are welcome now. */
export async function notifyUpdateAvailable(version: string): Promise<void> {
	if (!supported) return;

	try {
		const settings = readSettings();
		const allowed = shouldNotify(
			{
				quietHours: settings.quietHours,
				soundAlerts: settings.soundAlerts,
				vibrateAlerts: settings.vibrateAlerts
			},
			new Date()
		);

		if (!allowed) return;
		if (!(await ensurePermission())) return;

		await Notifications.scheduleNotificationAsync({
			identifier: UPDATE_NOTIFICATION_ID,
			content: {
				title: 'Update available',
				body: `NewzCrime ${version} is ready. Tap to install it.`,
				sound: settings.soundAlerts ? 'default' : undefined,
				vibrate: settings.vibrateAlerts ? [0, 200, 120, 200] : undefined,
				data: { type: 'update', version }
			},
			trigger: null
		});
	} catch {
		// The in-app banner is the primary channel; this is a courtesy.
	}
}

/** Removes the update notification once it has been acted on. */
export async function clearUpdateNotification(): Promise<void> {
	if (!supported) return;

	try {
		await Notifications.dismissNotificationAsync(UPDATE_NOTIFICATION_ID);
	} catch {
		// Nothing was shown.
	}
}
