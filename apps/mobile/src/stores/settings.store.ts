/**
 * Settings store (zustand).
 *
 * `saved` is the committed document and `draft` is what the UI edits; `changed`
 * lists the keys that differ. Saving copies `draft` onto `saved` and writes it
 * to storage, so a screen can present changes and commit them together.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { defaultSettings } from '@/constants/settings';
import type {
	SettingsKey,
	SettingsState,
	SettingsStore,
	StartTab
} from '@/types';

const STORAGE_KEY = 'newzcrime.settings.v1';

const diff = (saved: SettingsState, draft: SettingsState): SettingsKey[] =>
	(Object.keys(draft) as SettingsKey[]).filter(
		key => draft[key] !== saved[key]
	);

/** Fills in anything a newer build added since the document was stored. */
const migrateStartTab = (value: unknown): StartTab =>
	value === 'discover' ? 'search' : (value as StartTab);

export const withDefaults = (
	stored: Partial<SettingsState>
): SettingsState => ({
	...defaultSettings,
	...stored,
	startTab: stored.startTab
		? migrateStartTab(stored.startTab)
		: defaultSettings.startTab
});

export const useSettingsStore = create<SettingsStore>((set, get) => ({
	saved: defaultSettings,
	draft: defaultSettings,
	changed: [],
	isHydrated: false,

	set: <TKey extends SettingsKey>(key: TKey, value: SettingsState[TKey]) =>
		set(state => {
			const draft = { ...state.draft, [key]: value } as SettingsState;
			return { draft, changed: diff(state.saved, draft) };
		}),

	discard: () => set(state => ({ draft: state.saved, changed: [] })),

	save: () => {
		const saved = get().draft;
		set({ saved, changed: [] });
		void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
	},

	hydrate: async () => {
		try {
			const raw = await AsyncStorage.getItem(STORAGE_KEY);
			const saved = raw
				? withDefaults(JSON.parse(raw) as Partial<SettingsState>)
				: defaultSettings;
			set({ saved, draft: saved, changed: [], isHydrated: true });
		} catch {
			// Corrupt storage is not worth crashing over; defaults are safe.
			set({ isHydrated: true });
		}
	}
}));
