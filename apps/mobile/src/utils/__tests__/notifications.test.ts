/**
 * Quiet hours and briefing timing.
 *
 * A window that crosses midnight is the case worth pinning: it is the one a
 * naive `hour >= start && hour < end` gets wrong, and the one a reader is most
 * likely to notice.
 */

import { describe, expect, it } from 'vitest';

import {
	briefingMinutes,
	isQuietHour,
	msUntilBriefing,
	shouldNotify
} from '../notifications';

const at = (hours: number, minutes = 0): Date => {
	const date = new Date('2026-10-23T00:00:00');
	date.setHours(hours, minutes, 0, 0);
	return date;
};

describe('quiet hours', () => {
	it('allows everything when quiet hours are off', () => {
		expect(isQuietHour('off', at(3))).toBe(false);
		expect(isQuietHour('off', at(14))).toBe(false);
	});

	it('holds alerts inside the 22:00–06:00 window', () => {
		expect(isQuietHour('night', at(22))).toBe(true);
		expect(isQuietHour('night', at(23, 59))).toBe(true);
		expect(isQuietHour('night', at(0))).toBe(true);
		expect(isQuietHour('night', at(5, 59))).toBe(true);
	});

	it('releases alerts at the window edges', () => {
		expect(isQuietHour('night', at(6))).toBe(false);
		expect(isQuietHour('night', at(21, 59))).toBe(false);
	});

	it('handles the wider 21:00–07:00 window', () => {
		expect(isQuietHour('late', at(21))).toBe(true);
		expect(isQuietHour('late', at(6, 30))).toBe(true);
		expect(isQuietHour('late', at(7))).toBe(false);
	});

	it('turns shouldNotify into a yes outside the window only', () => {
		const preferences = {
			quietHours: 'night' as const,
			soundAlerts: true,
			vibrateAlerts: true
		};

		expect(shouldNotify(preferences, at(12))).toBe(true);
		expect(shouldNotify(preferences, at(2))).toBe(false);
	});
});

describe('briefing timing', () => {
	it('reads a briefing time as minutes after midnight', () => {
		expect(briefingMinutes('06:00')).toBe(360);
		expect(briefingMinutes('18:00')).toBe(1080);
	});

	it('measures forward to a briefing later today', () => {
		expect(msUntilBriefing('07:00', at(6, 30))).toBe(30 * 60 * 1000);
	});

	it('rolls over to tomorrow once the time has passed', () => {
		expect(msUntilBriefing('07:00', at(8))).toBe(23 * 60 * 60 * 1000);
	});

	it('never returns a non-positive delay', () => {
		for (const time of ['06:00', '07:00', '12:00', '18:00'] as const) {
			for (const hour of [0, 6, 7, 12, 18, 23]) {
				expect(msUntilBriefing(time, at(hour))).toBeGreaterThanOrEqual(
					60 * 1000
				);
			}
		}
	});
});
