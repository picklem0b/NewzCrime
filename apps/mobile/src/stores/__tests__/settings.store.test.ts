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
const { choiceOptions, defaultSettings, SETTINGS_KEY_COUNT } = await import(
	'@/constants/settings'
);

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

describe('the full 49-key document', () => {
	/** The keys added by the 1.15 settings release, seven per section. */
	const NEW_KEYS = {
		Appearance: [
			'accentColour',
			'fontStyle',
			'boldHeadlines',
			'reduceMotion',
			'density',
			'showThumbnails',
			'highContrast'
		],
		General: [
			'defaultTopic',
			'haptics',
			'openLinksInApp',
			'autoRefresh',
			'refreshInterval',
			'confirmBeforeClearing',
			'showMiniPlayer'
		],
		Reading: [
			'lineHeight',
			'textAlign',
			'readingProgress',
			'keepAwake',
			'playbackSpeed',
			'skipInterval',
			'resumePlayback'
		],
		Notifications: [
			'dailyBriefing',
			'briefingTime',
			'courtRulings',
			'quietHours',
			'soundAlerts',
			'vibrateAlerts',
			'savedOutlets'
		],
		Privacy: [
			'analytics',
			'crashReports',
			'personaliseFeed',
			'keepHistory',
			'dataSaver',
			'offlineImages',
			'clearCacheOnExit'
		],
		About: [
			'autoCheckUpdates',
			'updateChannel',
			'showVersionBadge',
			'showReleaseNotes',
			'includeDiagnostics',
			'showBuildInfo',
			'confirmBeforeInstall'
		]
	} as const;

	it('holds 49 keys: seven existing plus 42 new', () => {
		expect(SETTINGS_KEY_COUNT).toBe(49);
	});

	it('adds exactly seven settings to each of the six sections', () => {
		const added = Object.values(NEW_KEYS).flat();
		expect(added).toHaveLength(42);
		for (const key of added) {
			expect(defaultSettings, key).toHaveProperty(key);
		}
	});

	it('has a validator for every choice key and a boolean for the rest', () => {
		for (const [key, value] of Object.entries(defaultSettings)) {
			if (typeof value === 'boolean') continue;
			expect(choiceOptions, `${key} needs options`).toHaveProperty(key);
		}
	});

	it('accepts every default value unchanged', () => {
		expect(withDefaults(defaultSettings)).toEqual(defaultSettings);
	});

	it('rejects a value outside each new choice list', () => {
		const cases = [
			['accentColour', 'pink'],
			['fontStyle', 'mono'],
			['density', 'airy'],
			['defaultTopic', 'sport'],
			['refreshInterval', '60'],
			['lineHeight', 'double'],
			['textAlign', 'right'],
			['playbackSpeed', '3'],
			['skipInterval', '45'],
			['briefingTime', '05:00'],
			['quietHours', 'always'],
			['updateChannel', 'nightly']
		] as const;

		for (const [key, value] of cases) {
			const loaded = withDefaults({ [key]: value } as never);
			expect(loaded[key], key).toBe(defaultSettings[key]);
		}
	});

	it('rejects a non-boolean for each new toggle', () => {
		const toggles = [
			'boldHeadlines',
			'reduceMotion',
			'showThumbnails',
			'highContrast',
			'haptics',
			'openLinksInApp',
			'autoRefresh',
			'confirmBeforeClearing',
			'showMiniPlayer',
			'readingProgress',
			'keepAwake',
			'resumePlayback',
			'dailyBriefing',
			'courtRulings',
			'soundAlerts',
			'vibrateAlerts',
			'savedOutlets',
			'analytics',
			'crashReports',
			'personaliseFeed',
			'keepHistory',
			'dataSaver',
			'offlineImages',
			'clearCacheOnExit',
			'autoCheckUpdates',
			'showVersionBadge',
			'showReleaseNotes',
			'includeDiagnostics',
			'showBuildInfo',
			'confirmBeforeInstall'
		] as const;

		for (const key of toggles) {
			const loaded = withDefaults({ [key]: 'yes' } as never);
			expect(loaded[key], key).toBe(defaultSettings[key]);
		}
	});

	it('keeps every valid new value it is given', () => {
		const loaded = withDefaults({
			accentColour: 'violet',
			fontStyle: 'sans',
			density: 'compact',
			defaultTopic: 'court',
			refreshInterval: '5',
			lineHeight: 'loose',
			textAlign: 'justify',
			playbackSpeed: '1.5',
			skipInterval: '30',
			briefingTime: '18:00',
			quietHours: 'night',
			updateChannel: 'beta',
			highContrast: true,
			dataSaver: true
		} as never);

		expect(loaded).toMatchObject({
			accentColour: 'violet',
			fontStyle: 'sans',
			density: 'compact',
			defaultTopic: 'court',
			refreshInterval: '5',
			lineHeight: 'loose',
			textAlign: 'justify',
			playbackSpeed: '1.5',
			skipInterval: '30',
			briefingTime: '18:00',
			quietHours: 'night',
			updateChannel: 'beta',
			highContrast: true,
			dataSaver: true
		});
	});
});
