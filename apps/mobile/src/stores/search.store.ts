import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { RecentSearchesStore } from '@/types';

const STORAGE_KEY = 'newzcrime.recent-searches.v1';
const MAX_TERMS = 8;

const persist = (terms: string[]): void => {
	void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
};

export const useRecentSearchesStore = create<RecentSearchesStore>(
	(set, get) => ({
		terms: [],
		isHydrated: false,

		add: term => {
			const clean = term.trim();
			if (clean.length < 2) return;

			const terms = [
				clean,
				...get().terms.filter(
					existing => existing.toLowerCase() !== clean.toLowerCase()
				)
			].slice(0, MAX_TERMS);

			set({ terms });
			persist(terms);
		},

		remove: term => {
			const terms = get().terms.filter(existing => existing !== term);
			set({ terms });
			persist(terms);
		},

		clear: () => {
			set({ terms: [] });
			void AsyncStorage.removeItem(STORAGE_KEY);
		},

		hydrate: async () => {
			try {
				const raw = await AsyncStorage.getItem(STORAGE_KEY);
				const parsed: unknown = raw ? JSON.parse(raw) : [];
				const terms = Array.isArray(parsed)
					? parsed.filter(
							(value): value is string =>
								typeof value === 'string'
						)
					: [];
				set({ terms: terms.slice(0, MAX_TERMS), isHydrated: true });
			} catch {
				set({ isHydrated: true });
			}
		}
	})
);
