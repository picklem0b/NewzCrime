/**
 * Following store (zustand).
 *
 * Following is a local preference, not an account feature: the app stores only
 * source ids, then joins them against the directory it already loads. That
 * keeps the list small and means a followed source can change its name or
 * logo without leaving a stale snapshot behind.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { FollowingStore } from '@/types';

const STORAGE_KEY = 'newzcrime.following.v1';

/** Enough for every source in the directory, with room for future entries. */
const MAX_FOLLOWING = 200;

const persist = (sourceIds: string[]): void => {
	void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sourceIds));
};

export const useFollowingStore = create<FollowingStore>((set, get) => ({
	sourceIds: [],
	isHydrated: false,

	isFollowing: sourceId => get().sourceIds.includes(sourceId),

	toggle: sourceId => {
		const sourceIds = get().sourceIds.includes(sourceId)
			? get().sourceIds.filter(existing => existing !== sourceId)
			: [sourceId, ...get().sourceIds].slice(0, MAX_FOLLOWING);

		set({ sourceIds });
		persist(sourceIds);
	},

	clear: () => {
		set({ sourceIds: [] });
		void AsyncStorage.removeItem(STORAGE_KEY);
	},

	hydrate: async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const parsed: unknown = raw ? JSON.parse(raw) : [];
			const sourceIds = Array.isArray(parsed)
				? parsed.filter(
						(value): value is string => typeof value === 'string'
					)
				: [];
			set({
				sourceIds: sourceIds.slice(0, MAX_FOLLOWING),
				isHydrated: true
			});
		} catch {
			set({ isHydrated: true });
		}
	}
}));
