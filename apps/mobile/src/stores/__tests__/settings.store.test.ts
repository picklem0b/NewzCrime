/**
 * Settings store tests.
 *
 * The draft/commit split is the part worth pinning: edits must be visible
 * before they are applied, discardable, and only written to storage on save.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem } = vi.hoisted(() => ({
	getItem: vi.fn(),
	setItem: vi.fn()
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { getItem, setItem }
}));

const { useSettingsStore, withDefaults } = await import('.././settings.store');
const { defaultSettings } = await import('@/constants/settings');

const STORAGE_KEY = 'newzcrime.settings.v1';

beforeEach(() => {
	useSettingsStore.setState({
		saved: defaultSettings,
		draft: defaultSettings,
		changed: [],
		isHydrated: false
	});
	getItem.mockReset();
	setItem.mockReset();
	setItem.mockResolvedValue(undefined);
});

describe('settings store', () => {
	it('starts from the defaults', () => {
		expect(useSettingsStore.getState().saved).toEqual(defaultSettings);
		expect(useSettingsStore.getState().changed).toEqual([]);
	});

	it('edits the draft without touching the committed settings', () => {
		useSettingsStore.getState().set('colourMode', 'dark');

		const state = useSettingsStore.getState();
		expect(state.draft.colourMode).toBe('dark');
		// Nothing is committed until save.
		expect(state.saved.colourMode).toBe('system');
		expect(state.changed).toEqual(['colourMode']);
	});

	it('stops reporting a key once it is edited back', () => {
		const { set } = useSettingsStore.getState();

		set('colourMode', 'dark');
		expect(useSettingsStore.getState().changed).toEqual(['colourMode']);

		set('colourMode', 'system');
		expect(useSettingsStore.getState().changed).toEqual([]);
	});

	it('tracks several changed keys at once', () => {
		const { set } = useSettingsStore.getState();

		set('textSize', 'large');
		set('autoplayNext', true);

		expect(useSettingsStore.getState().changed).toEqual([
			'textSize',
			'autoplayNext'
		]);
	});

	it('does not write to storage until save is called', () => {
		useSettingsStore.getState().set('textSize', 'large');
		expect(setItem).not.toHaveBeenCalled();

		useSettingsStore.getState().save();
		expect(setItem).toHaveBeenCalledWith(
			STORAGE_KEY,
			JSON.stringify(useSettingsStore.getState().saved)
		);
	});

	it('commits the draft on save and clears the change list', () => {
		const { set, save } = useSettingsStore.getState();

		set('startTab', 'search');
		save();

		const state = useSettingsStore.getState();
		expect(state.saved.startTab).toBe('search');
		expect(state.draft.startTab).toBe('search');
		expect(state.changed).toEqual([]);
	});

	it('discards edits and restores the committed settings', () => {
		const { set, discard } = useSettingsStore.getState();

		set('breakingNews', false);
		discard();

		const state = useSettingsStore.getState();
		expect(state.draft).toEqual(defaultSettings);
		expect(state.changed).toEqual([]);
	});

	it('hydrates a stored document', async () => {
		getItem.mockResolvedValue(
			JSON.stringify({ ...defaultSettings, colourMode: 'light' })
		);

		await useSettingsStore.getState().hydrate();

		const state = useSettingsStore.getState();
		expect(state.saved.colourMode).toBe('light');
		expect(state.draft.colourMode).toBe('light');
		expect(state.isHydrated).toBe(true);
	});

	it('fills in defaults for a key a newer build added', async () => {
		// A document written before `autoplayNext` existed.
		getItem.mockResolvedValue(JSON.stringify({ colourMode: 'dark' }));

		await useSettingsStore.getState().hydrate();

		const { saved } = useSettingsStore.getState();
		expect(saved.colourMode).toBe('dark');
		expect(saved.autoplayNext).toBe(defaultSettings.autoplayNext);
		expect(saved.textSize).toBe(defaultSettings.textSize);
	});

	it('falls back to defaults when storage is corrupt, not to a crash', async () => {
		getItem.mockResolvedValue('{not json');

		await useSettingsStore.getState().hydrate();

		const state = useSettingsStore.getState();
		expect(state.saved).toEqual(defaultSettings);
		expect(state.isHydrated).toBe(true);
	});

	it('still hydrates when storage rejects', async () => {
		getItem.mockRejectedValue(new Error('storage unavailable'));

		await useSettingsStore.getState().hydrate();

		expect(useSettingsStore.getState().isHydrated).toBe(true);
	});
});

describe('stored start tab migration', () => {
	it('maps the retired discover tab to search', async () => {
		const { withDefaults } = await import('.././settings.store');

		expect(withDefaults({ startTab: 'discover' as never }).startTab).toBe(
			'search'
		);
	});

	it('keeps the default when no start tab was stored', async () => {
		const { withDefaults } = await import('.././settings.store');

		expect(withDefaults({}).startTab).toBe('home');
	});
});

describe('stored values are checked, not trusted', () => {
	/**
	 * `colourMode` indexes the palettes, so an unrecognised value resolves to
	 * `undefined` and every screen that reads a colour throws. Storage can hold
	 * a value from an older build, or one a reader edited on a rooted device.
	 */
	it('falls back for a colour mode that is not one of the offered values', () => {
		expect(withDefaults({ colourMode: 'System' as never }).colourMode).toBe(
			defaultSettings.colourMode
		);
		expect(withDefaults({ colourMode: 'sepia' as never }).colourMode).toBe(
			defaultSettings.colourMode
		);
	});

	it('falls back for a text size that is not one of the offered values', () => {
		expect(withDefaults({ textSize: 'LARGE' as never }).textSize).toBe(
			defaultSettings.textSize
		);
	});

	it('falls back for a start tab that is not one of the offered values', () => {
		expect(withDefaults({ startTab: 'bogus' as never }).startTab).toBe(
			defaultSettings.startTab
		);
	});

	it('falls back for a flag that is not a boolean', () => {
		const loaded = withDefaults({ autoplayNext: 'yes' as never });
		expect(loaded.autoplayNext).toBe(defaultSettings.autoplayNext);
	});

	it('keeps every valid value it is given', () => {
		const loaded = withDefaults({
			colourMode: 'light',
			textSize: 'large',
			startTab: 'saved',
			autoplayNext: true
		});

		expect(loaded).toMatchObject({
			colourMode: 'light',
			textSize: 'large',
			startTab: 'saved',
			autoplayNext: true
		});
	});

	it('leaves no key undefined for a document of junk', () => {
		const loaded = withDefaults({
			colourMode: null as never,
			textSize: 42 as never,
			startTab: [] as never,
			breakingNews: 'nope' as never
		});

		for (const [key, value] of Object.entries(loaded)) {
			expect(value, `${key} must not be undefined`).toBeDefined();
		}
	});
});
