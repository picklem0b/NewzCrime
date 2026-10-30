/** Following store tests: toggle, persistence, cap and corrupt storage. */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem, removeItem } = vi.hoisted(() => ({
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn()
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { getItem, setItem, removeItem }
}));

const { useFollowingStore } = await import('.././following.store');

const STORAGE_KEY = 'newzcrime.following.v1';

beforeEach(() => {
	useFollowingStore.setState({ sourceIds: [], isHydrated: false });
	getItem.mockReset();
	setItem.mockReset();
	removeItem.mockReset();
	setItem.mockResolvedValue(undefined);
	removeItem.mockResolvedValue(undefined);
});

describe('following store', () => {
	it('follows a source and reports it', () => {
		useFollowingStore.getState().toggle('source-a');

		expect(useFollowingStore.getState().sourceIds).toEqual(['source-a']);
		expect(useFollowingStore.getState().isFollowing('source-a')).toBe(true);
	});

	it('unfollows on a second toggle and persists the removal', () => {
		useFollowingStore.getState().toggle('source-a');
		useFollowingStore.getState().toggle('source-a');

		expect(useFollowingStore.getState().sourceIds).toEqual([]);
		expect(setItem).toHaveBeenLastCalledWith(STORAGE_KEY, '[]');
	});

	it('does not add the same source twice', () => {
		useFollowingStore.getState().toggle('source-a');
		useFollowingStore.getState().toggle('source-a');
		useFollowingStore.getState().toggle('source-a');

		expect(useFollowingStore.getState().sourceIds).toEqual(['source-a']);
	});

	it('puts the newest follow first', () => {
		useFollowingStore.getState().toggle('source-a');
		useFollowingStore.getState().toggle('source-b');

		expect(useFollowingStore.getState().sourceIds).toEqual([
			'source-b',
			'source-a'
		]);
	});

	it('caps the list so it cannot grow without limit', () => {
		for (let index = 0; index < 220; index += 1) {
			useFollowingStore.getState().toggle(`source-${index}`);
		}

		expect(useFollowingStore.getState().sourceIds).toHaveLength(200);
	});

	it('clears the list and its storage entry', () => {
		useFollowingStore.getState().toggle('source-a');
		useFollowingStore.getState().clear();

		expect(useFollowingStore.getState().sourceIds).toEqual([]);
		expect(removeItem).toHaveBeenCalledWith(STORAGE_KEY);
	});

	it('hydrates only string ids', async () => {
		getItem.mockResolvedValue(
			JSON.stringify(['source-a', 42, null, 'source-b'])
		);

		await useFollowingStore.getState().hydrate();

		expect(useFollowingStore.getState().sourceIds).toEqual([
			'source-a',
			'source-b'
		]);
		expect(useFollowingStore.getState().isHydrated).toBe(true);
	});

	it('starts empty when storage is corrupt', async () => {
		getItem.mockResolvedValue('{not json');

		await useFollowingStore.getState().hydrate();

		expect(useFollowingStore.getState().sourceIds).toEqual([]);
		expect(useFollowingStore.getState().isHydrated).toBe(true);
	});

	it('ignores a stored value that is not a list', async () => {
		getItem.mockResolvedValue(JSON.stringify({ nope: true }));

		await useFollowingStore.getState().hydrate();

		expect(useFollowingStore.getState().sourceIds).toEqual([]);
	});
});
