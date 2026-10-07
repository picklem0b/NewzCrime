/**
 * Update-check tests.
 *
 * The interesting cases are not the happy path but the two that a reader
 * actually sees: being told an update exists, and a failing update service that
 * must not look like a broken app.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('.././apiService', () => ({
  apiClient: { get },
  apiBaseUrl: 'http://example.test',
}));

const { version } = vi.hoisted(() => ({ version: { value: '1.2.0' } }));

vi.mock('expo-constants', () => ({
  default: {
    get expoConfig() {
      return { version: version.value };
    },
  },
}));

const { checkForUpdates, currentVersion } = await import('.././updateService');

beforeEach(() => {
  get.mockReset();
  version.value = '1.2.0';
});

describe('currentVersion', () => {
  it('reads the version from the app config', () => {
    expect(currentVersion()).toBe('1.2.0');
  });

  it('falls back to 0.0.0 when the config has no version', () => {
    version.value = undefined as unknown as string;
    // `expoConfig.version` is absent rather than empty in a bare config.
    expect(currentVersion()).toBe('0.0.0');
  });
});

describe('checkForUpdates', () => {
  const release = (latestVersion: string) => ({
    latestVersion,
    minimumVersion: '1.0.0',
    notes: [],
  });

  it('reports up to date when the running version is the latest', async () => {
    get.mockResolvedValue(release('1.2.0'));
    await expect(checkForUpdates()).resolves.toEqual({
      status: 'up_to_date',
      currentVersion: '1.2.0',
    });
  });

  it('reports up to date when the running version is ahead of the API', async () => {
    version.value = '1.3.0';
    get.mockResolvedValue(release('1.2.0'));
    await expect(checkForUpdates()).resolves.toMatchObject({
      status: 'up_to_date',
    });
  });

  it('reports an available update with both versions', async () => {
    version.value = '1.2.0';
    get.mockResolvedValue(release('1.5.1'));
    await expect(checkForUpdates()).resolves.toEqual({
      status: 'update_available',
      currentVersion: '1.2.0',
      latestVersion: '1.5.1',
    });
  });

  it('returns an error result, not a throw, when the service is unreachable', async () => {
    get.mockRejectedValue(new Error('Network request failed'));
    await expect(checkForUpdates()).resolves.toEqual({
      status: 'error',
      message: 'Network request failed',
    });
  });

  it('describes a non-Error rejection instead of blanking the message', async () => {
    get.mockRejectedValue('boom');
    await expect(checkForUpdates()).resolves.toMatchObject({
      status: 'error',
      message: 'Could not reach the update service',
    });
  });
});
