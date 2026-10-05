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
  notes: ReleaseNotes[];
}

export function currentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export function fetchReleaseNotes(): Promise<ReleaseInfo> {
  return apiClient.get<ReleaseInfo>('/v1/app/version');
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const current = currentVersion();

  try {
    const info = await apiClient.get<ReleaseInfo>('/v1/app/version');

    if (compareVersions(current, info.latestVersion) >= 0) {
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
