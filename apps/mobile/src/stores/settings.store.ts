/**
 * Settings store (zustand).
 *
 * `saved` is the committed document and `draft` is what the UI edits; `changed`
 * lists the keys that differ. Saving copies `draft` onto `saved` and writes it
 * to storage, so a screen can present changes and commit them together.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
	colourModes,
	defaultSettings,
	startTabs,
	textSizes
} from '@/constants/settings';
import type { Option, SettingsKey, SettingsState, SettingsStore } from '@/types';

const STORAGE_KEY = 'newzcrime.settings.v1';

const diff = (saved: SettingsState, draft: SettingsState): SettingsKey[] =>
	(Object.keys(draft) as SettingsKey[]).filter(
		key => draft[key] !== saved[key]
	);

/** The ids a picker offers, so the store accepts exactly what the UI can set. */
const idsOf = <TId extends string>(
	options: readonly Option<TId>[]
): readonly TId[] => options.map(option => option.id);

const isOneOf = <TId extends string>(
	options: readonly Option<TId>[],
	value: unknown
): value is TId => idsOf(options).includes(value as TId);

const asBoolean = (value: unknown, fallback: boolean): boolean =>
	typeof value === 'boolean' ? value : fallback;

/** `discover` was a start tab before Search replaced it as the browse entry. */
const migrateStartTab = (value: unknown): unknown =>
	value === 'discover' ? 'search' : value;

/**
 * Brings a stored document up to date and rejects anything unreadable.
 *
 * Stored values are checked, not trusted. They come from a build that may be
 * older, and a reader with a rooted device can edit them; `colourMode` in
 * particular is used to index the palettes, so an unrecognised value would
 * resolve to `undefined` and take down every screen that reads a colour. Each
 * field therefore falls back to its default rather than being cast.
 */
export const withDefaults = (stored: Partial<SettingsState>): SettingsState => {
	const startTab = migrateStartTab(stored.startTab);

	return {
		...defaultSettings,
		colourMode: isOneOf(colourModes, stored.colourMode)
			? stored.colourMode
			: defaultSettings.colourMode,
		textSize: isOneOf(textSizes, stored.textSize)
			? stored.textSize
			: defaultSettings.textSize,
		startTab: isOneOf(startTabs, startTab)
			? startTab
			: defaultSettings.startTab,
		breakingNews: asBoolean(stored.breakingNews, defaultSettings.breakingNews),
		podcastNotifications: asBoolean(
			stored.podcastNotifications,
			defaultSettings.podcastNotifications
		),
		downloadOnWifi: asBoolean(
			stored.downloadOnWifi,
			defaultSettings.downloadOnWifi
		),
		autoplayNext: asBoolean(stored.autoplayNext, defaultSettings.autoplayNext)
	};
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
