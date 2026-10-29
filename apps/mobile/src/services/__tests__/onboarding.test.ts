/** First-run flag: shown once, and never traps a reader with broken storage. */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem } = vi.hoisted(() => ({
	getItem: vi.fn(),
	setItem: vi.fn()
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { getItem, setItem }
}));

const { hasSeenOnboarding, markOnboardingSeen } = await import('../onboarding');

beforeEach(() => {
	getItem.mockReset();
	setItem.mockReset().mockResolvedValue(undefined);
});

describe('hasSeenOnboarding', () => {
	it('is false before the introduction has run', async () => {
		getItem.mockResolvedValue(null);
		expect(await hasSeenOnboarding()).toBe(false);
	});

	it('is true after it has run', async () => {
		getItem.mockResolvedValue('seen');
		expect(await hasSeenOnboarding()).toBe(true);
	});

	it('skips the introduction when storage cannot be read', async () => {
		getItem.mockRejectedValue(new Error('storage unavailable'));
		expect(await hasSeenOnboarding()).toBe(true);
	});
});

describe('markOnboardingSeen', () => {
	it('writes the versioned key', async () => {
		await markOnboardingSeen();

		expect(setItem).toHaveBeenCalledWith('newzcrime.onboarding.v1', 'seen');
	});

	it('does not reject when the write fails', async () => {
		setItem.mockRejectedValue(new Error('disk full'));

		await expect(markOnboardingSeen()).resolves.toBeUndefined();
	});
});
