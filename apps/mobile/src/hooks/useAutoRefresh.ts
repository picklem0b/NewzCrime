/**
 * Background refresh for the feed, driven by the General settings.
 *
 * The timer only fires while the app is in the foreground: a refresh while the
 * reader is elsewhere spends their data for something they cannot see, and on
 * the free hosting tier every avoided cold request matters.
 */

import { useEffect } from 'react';
import { AppState } from 'react-native';

import type { RefreshInterval } from '@/types';

/** The interval in milliseconds, or `null` when refreshing is off. */
export function refreshIntervalMs(interval: RefreshInterval): number | null {
	if (interval === 'off') return null;

	const minutes = Number(interval);
	if (!Number.isFinite(minutes) || minutes <= 0) return null;

	return minutes * 60 * 1000;
}

export function useAutoRefresh(
	refresh: () => void,
	enabled: boolean,
	interval: RefreshInterval
): void {
	useEffect(() => {
		const every = refreshIntervalMs(interval);
		if (!enabled || every === null) return undefined;

		const timer = setInterval(() => {
			if (AppState.currentState === 'active') refresh();
		}, every);

		return () => clearInterval(timer);
	}, [enabled, interval, refresh]);
}
