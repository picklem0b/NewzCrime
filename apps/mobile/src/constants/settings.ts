/**
 * Settings values: the defaults and the lists a picker renders.
 *
 * Values only — no components, no state, no React. Every list is typed against
 * the matching union in `@/types`, so a typo is a compile error. `choiceOptions`
 * is derived from these lists and is what the store validates stored documents
 * against, so the UI and the validator cannot disagree about what is allowed.
 */

import type {
	AccentColour,
	BriefingTime,
	ColourMode,
	DefaultTopic,
	Density,
	FontStyle,
	LineHeight,
	Option,
	PlaybackSpeed,
	QuietHours,
	RefreshInterval,
	SettingsKey,
	SettingsState,
	SkipInterval,
	StartTab,
	TextAlign,
	TextSize,
	UpdateChannel
} from '@/types';

/* ===== Appearance ===== */

export const colourModes: readonly Option<ColourMode>[] = [
	{ id: 'system', label: 'System' },
	{ id: 'light', label: 'Light' },
	{ id: 'dark', label: 'Dark' }
];

export const textSizes: readonly Option<TextSize>[] = [
	{ id: 'small', label: 'Small' },
	{ id: 'default', label: 'Default' },
	{ id: 'large', label: 'Large' }
];

export const accentColours: readonly Option<AccentColour>[] = [
	{ id: 'orange', label: 'Ember' },
	{ id: 'blue', label: 'Cobalt' },
	{ id: 'green', label: 'Verdict' },
	{ id: 'violet', label: 'Nightfall' }
];

export const fontStyles: readonly Option<FontStyle>[] = [
	{ id: 'serif', label: 'Serif' },
	{ id: 'sans', label: 'Sans' }
];

export const densities: readonly Option<Density>[] = [
	{ id: 'comfortable', label: 'Comfortable' },
	{ id: 'compact', label: 'Compact' }
];

/* ===== General ===== */

export const startTabs: readonly Option<StartTab>[] = [
	{ id: 'home', label: 'Today' },
	{ id: 'search', label: 'Search' },
	{ id: 'saved', label: 'Library' }
];

export const defaultTopics: readonly Option<DefaultTopic>[] = [
	{ id: 'all', label: 'Top' },
	{ id: 'court', label: 'Court' },
	{ id: 'crime', label: 'Crime' },
	{ id: 'politics', label: 'Politics' },
	{ id: 'world', label: 'World' }
];

export const refreshIntervals: readonly Option<RefreshInterval>[] = [
	{ id: 'off', label: 'Off' },
	{ id: '5', label: '5 min' },
	{ id: '15', label: '15 min' },
	{ id: '30', label: '30 min' }
];

/* ===== Reading ===== */

export const lineHeights: readonly Option<LineHeight>[] = [
	{ id: 'tight', label: 'Tight' },
	{ id: 'normal', label: 'Normal' },
	{ id: 'loose', label: 'Loose' }
];

export const textAligns: readonly Option<TextAlign>[] = [
	{ id: 'left', label: 'Left' },
	{ id: 'justify', label: 'Justified' }
];

export const playbackSpeeds: readonly Option<PlaybackSpeed>[] = [
	{ id: '0.8', label: '0.8×' },
	{ id: '1', label: '1×' },
	{ id: '1.2', label: '1.2×' },
	{ id: '1.5', label: '1.5×' }
];

export const skipIntervals: readonly Option<SkipInterval>[] = [
	{ id: '10', label: '10 s' },
	{ id: '15', label: '15 s' },
	{ id: '30', label: '30 s' }
];

/* ===== Notifications ===== */

export const briefingTimes: readonly Option<BriefingTime>[] = [
	{ id: '06:00', label: '06:00' },
	{ id: '07:00', label: '07:00' },
	{ id: '12:00', label: '12:00' },
	{ id: '18:00', label: '18:00' }
];

export const quietHoursOptions: readonly Option<QuietHours>[] = [
	{ id: 'off', label: 'Off' },
	{ id: 'night', label: '22:00–06:00' },
	{ id: 'late', label: '21:00–07:00' }
];

/* ===== About ===== */

export const updateChannels: readonly Option<UpdateChannel>[] = [
	{ id: 'stable', label: 'Stable' },
	{ id: 'beta', label: 'Beta' }
];

/* ===== Defaults ===== */

export const defaultSettings: SettingsState = {
	// Appearance
	colourMode: 'system',
	textSize: 'default',
	accentColour: 'orange',
	fontStyle: 'serif',
	boldHeadlines: true,
	reduceMotion: false,
	density: 'comfortable',
	showThumbnails: true,
	highContrast: false,

	// General
	startTab: 'home',
	defaultTopic: 'all',
	haptics: true,
	openLinksInApp: true,
	autoRefresh: true,
	refreshInterval: '15',
	confirmBeforeClearing: true,
	showMiniPlayer: true,

	// Reading
	lineHeight: 'normal',
	textAlign: 'left',
	readingProgress: true,
	keepAwake: false,
	playbackSpeed: '1',
	skipInterval: '15',
	resumePlayback: true,
	autoplayNext: false,

	// Notifications
	breakingNews: true,
	podcastNotifications: true,
	dailyBriefing: false,
	briefingTime: '07:00',
	courtRulings: true,
	quietHours: 'off',
	soundAlerts: true,
	vibrateAlerts: true,
	savedOutlets: false,

	// Privacy and data
	downloadOnWifi: true,
	analytics: false,
	crashReports: true,
	personaliseFeed: false,
	keepHistory: true,
	dataSaver: false,
	offlineImages: true,
	clearCacheOnExit: false,

	// About
	autoCheckUpdates: true,
	updateChannel: 'stable',
	showVersionBadge: true,
	showReleaseNotes: true,
	includeDiagnostics: false,
	showBuildInfo: false,
	confirmBeforeInstall: true
};

const idsOf = <TId extends string>(
	options: readonly Option<TId>[]
): readonly TId[] => options.map(option => option.id);

/**
 * Ids accepted for every choice-valued key.
 *
 * Boolean keys are absent: their validator is simply "is it a boolean". Keeping
 * both checks in one place means a new setting cannot ship without validation.
 */
export const choiceOptions = {
	colourMode: idsOf(colourModes),
	textSize: idsOf(textSizes),
	accentColour: idsOf(accentColours),
	fontStyle: idsOf(fontStyles),
	density: idsOf(densities),
	startTab: idsOf(startTabs),
	defaultTopic: idsOf(defaultTopics),
	refreshInterval: idsOf(refreshIntervals),
	lineHeight: idsOf(lineHeights),
	textAlign: idsOf(textAligns),
	playbackSpeed: idsOf(playbackSpeeds),
	skipInterval: idsOf(skipIntervals),
	briefingTime: idsOf(briefingTimes),
	quietHours: idsOf(quietHoursOptions),
	updateChannel: idsOf(updateChannels)
} satisfies Partial<Record<SettingsKey, readonly string[]>>;

/** How many keys the document holds; pinned by the store tests. */
export const SETTINGS_KEY_COUNT = Object.keys(defaultSettings).length;
