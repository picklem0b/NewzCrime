/**
 * Update check.
 *
 * The app version is compared against the latest release the API reports.
 * Installing an update still happens through the store or the development
 * client; this only tells the reader whether one exists.
 */

import Constants from 'expo-constants';

import type { UpdateCheckResult } from '@/types';
import { compareVersions } from '@/utils/version';

import { apiClient } from './apiService';

export interface ReleaseNotes {
  version: string;
  highlights: readonly string[];
}

export interface ReleaseInfo {
  latestVersion: string;
  minimumVersion: string;
  /** Where the reader goes to install the newer build. */
  downloadUrl: string;
  notes: ReleaseNotes[];
}

export function currentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * The newest release note, or `null` when the server sent none.
 *
 * Only the latest is shown: the panel renders one release, and the full history
 * lives in `CHANGELOG.md`. Newest first is guaranteed server-side, so this is
 * `notes[0]`.
 */
export function latestRelease(notes: readonly ReleaseNotes[]): ReleaseNotes | null {
  return notes[0] ?? null;
}

/** Numeric version parts only; `compareVersions` reads the same shape. */
const VERSION_PATTERN = /^\d+(\.\d+)*$/;

/**
 * Whether this build is older than the version the server reports.
 *
 * Both sides are checked for a version shape first. `compareVersions` maps an
 * unreadable part to zero rather than complaining, so without this a build
 * whose version could not be read would silently compare as `0.0.0` and be
 * told to update forever. Refusing to guess is the safer answer.
 */
export function isUpdateAvailable(
  current: string,
  info: ReleaseInfo
): boolean {
  const running = current.trim();
  const latest = info.latestVersion.trim();

  if (!VERSION_PATTERN.test(running) || !VERSION_PATTERN.test(latest)) {
    return false;
  }

  return compareVersions(running, latest) < 0;
}

export function fetchReleaseNotes(): Promise<ReleaseInfo> {
  return apiClient.get<ReleaseInfo>('/v1/app/version');
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const current = currentVersion();

  try {
    const info = await apiClient.get<ReleaseInfo>('/v1/app/version');

    // Uses the same guard as the update button, so the check and the button
    // cannot disagree about whether this build is behind.
    if (!isUpdateAvailable(current, info)) {
      return { status: 'up_to_date', currentVersion: current };
    }

    return {
      status: 'update_available',
      currentVersion: current,
      latestVersion: info.latestVersion,
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Could not reach the update service',
    };
  }
}
