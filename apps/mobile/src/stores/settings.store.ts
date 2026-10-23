/**
 * Settings store (zustand).
 *
 * `saved` is the committed document and `draft` is what the UI edits; `changed`
 * lists the keys that differ. Saving copies `draft` onto `saved` and writes it
 * to storage, so a screen can present changes and commit them together.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { choiceOptions, defaultSettings } from '@/constants/settings';
import type { SettingsKey, SettingsState, SettingsStore } from '@/types';

const STORAGE_KEY = 'newzcrime.settings.v1';

const diff = (saved: SettingsState, draft: SettingsState): SettingsKey[] =>
	(Object.keys(draft) as SettingsKey[]).filter(
		key => draft[key] !== saved[key]
	);

/** `discover` was a start tab before Search replaced it as the browse entry. */
const migrateStartTab = (value: unknown): unknown =>
	value === 'discover' ? 'search' : value;

/**
 * Brings a stored document up to date and rejects anything unreadable.
 *
 * Stored values are checked, not trusted. They come from a build that may be
 * older, and a reader with a rooted device can edit them; `colourMode` in
 * particular is used to index the palettes, so an unrecognised value would
 * resolve to `undefined` and take down every screen that reads a colour.
 *
 * Both checks are driven by the defaults: a boolean key must be a boolean and a
 * choice key must be one of the ids the picker offers. Adding a setting to
 * `defaultSettings` therefore adds its validation at the same time.
 */
export const withDefaults = (stored: unknown): SettingsState => {
	const source =
		stored !== null && typeof stored === 'object'
			? (stored as Record<string, unknown>)
			: {};

	const migrated: Record<string, unknown> = {
		...source,
		startTab: migrateStartTab(source.startTab)
	};

	// `choiceOptions` is declared with `satisfies`, so it knows exactly which
	// keys are choices; this view lets the loop index it by any settings key.
	const choices: Partial<Record<SettingsKey, readonly string[]>> = choiceOptions;

	const next: Record<string, unknown> = {};

	for (const key of Object.keys(defaultSettings) as SettingsKey[]) {
		const fallback = defaultSettings[key];
		const value = migrated[key];

		if (typeof fallback === 'boolean') {
			next[key] = typeof value === 'boolean' ? value : fallback;
			continue;
		}

		const allowed = choices[key] ?? [];
		next[key] =
			typeof value === 'string' && allowed.includes(value)
				? value
				: fallback;
	}

	return next as unknown as SettingsState;
};

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
			const saved = raw ? withDefaults(JSON.parse(raw)) : defaultSettings;
			set({ saved, draft: saved, changed: [], isHydrated: true });
		} catch {
			// Corrupt storage is not worth crashing over; defaults are safe.
			set({ isHydrated: true });
		}
	}
}));

/** Reads the committed settings outside React, for services and utilities. */
export const readSettings = (): SettingsState => useSettingsStore.getState().saved;
