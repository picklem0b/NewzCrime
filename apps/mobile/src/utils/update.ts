/**
 * Pure update decisions.
 *
 * The download itself needs native modules, which cannot run under Vitest, so
 * every choice that can be made without touching the device lives here: the
 * file name, which URL a channel points at, and whether this platform can
 * install a package at all.
 */

import type { UpdateChannel } from '@/types';

export const SUPPORTED_INSTALL_PLATFORM = 'android';

/** Local file name for a downloaded build. */
export function apkFileName(version: string): string {
	const safe = version.trim().replace(/[^0-9A-Za-z._-]/g, '-');
	return `newzcrime-${safe}.apk`;
}

/** Whether an APK can be installed on this platform. */
export function isInstallSupported(platform: string): boolean {
	return platform === SUPPORTED_INSTALL_PLATFORM;
}

export interface DownloadSources {
	downloadUrl: string;
	betaDownloadUrl?: string | undefined;
}

/**
 * The URL a channel should download.
 *
 * A beta build falls back to the stable URL rather than failing: a reader who
 * opted into beta on a release without one still gets the current build.
 */
export function releaseDownloadUrl(
	info: DownloadSources,
	channel: UpdateChannel
): string {
	if (channel === 'beta' && info.betaDownloadUrl) return info.betaDownloadUrl;
	return info.downloadUrl;
}

/** Progress as a whole percentage, clamped to 0–100. */
export function progressPercent(written: number, total: number): number {
	if (!Number.isFinite(total) || total <= 0) return 0;
	return Math.min(100, Math.max(0, Math.round((written / total) * 100)));
}

/** Snooze window after the reader chooses "Later". */
export const SNOOZE_MS = 24 * 60 * 60 * 1000;
