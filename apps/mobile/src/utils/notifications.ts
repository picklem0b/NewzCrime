/**
 * Notification timing rules.
 *
 * Kept pure so the awkward part — a quiet window that wraps past midnight — is
 * tested without a device. The app treats quiet hours as a hold, not a drop:
 * an alert that falls inside the window can still be delivered afterwards.
 */

import type { BriefingTime, QuietHours } from '@/types';

export interface AlertPreferences {
	quietHours: QuietHours;
	soundAlerts: boolean;
	vibrateAlerts: boolean;
}

/** Hours for each quiet window, inclusive of the start and exclusive of the end. */
export const QUIET_WINDOWS: Record<
	Exclude<QuietHours, 'off'>,
	{ start: number; end: number }
> = {
	night: { start: 22, end: 6 },
	late: { start: 21, end: 7 }
};

/** True when `date` falls inside the selected quiet window. */
export function isQuietHour(quietHours: QuietHours, date: Date): boolean {
	if (quietHours === 'off') return false;

	const { start, end } = QUIET_WINDOWS[quietHours];
	const hour = date.getHours();

	if (start < end) return hour >= start && hour < end;
	return hour >= start || hour < end;
}

/** Whether an alert may be shown now. */
export function shouldNotify(
	preferences: AlertPreferences,
	date: Date
): boolean {
	return !isQuietHour(preferences.quietHours, date);
}

/** Minutes after midnight for a briefing time. */
export function briefingMinutes(time: BriefingTime): number {
	const [hours, minutes] = time.split(':');
	return Number(hours) * 60 + Number(minutes);
}

/**
 * Milliseconds until the next briefing, from `now`.
 *
 * Always positive: a briefing time already past today schedules for tomorrow.
 */
export function msUntilBriefing(time: BriefingTime, now: Date): number {
	const target = briefingMinutes(time);
	const current = now.getHours() * 60 + now.getMinutes();
	const delta = target > current ? target - current : 24 * 60 - current + target;
	return delta * 60 * 1000;
}
