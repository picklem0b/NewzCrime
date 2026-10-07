/**
 * Types the app declares for itself, settings included. Shapes that cross the
 * network come from `@newzcrime/shared`; the values that fill these types live
 * in the matching `constants.ts`.
 */

import type { ContentItem, Source } from '@newzcrime/shared';

/**
 * The single way loading state is represented in this app.
 *
 * A discriminated union beats `{ loading: boolean; error?: string; data?: T }`
 * because it makes "loading *and* errored" impossible to express.
 */
export type AsyncState<TData> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'success'; data: TData }
	| { status: 'error'; error: string };

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */

/** Which palette is active after the setting and the OS are resolved. */
export type ColourScheme = 'light' | 'dark';

/** Every colour the app may use. Both palettes share these keys. */
export interface ColourTokens {
	background: string;
	surface: string;
	surfaceRaised: string;
	skeleton: string;
	border: string;
	borderStrong: string;
	pressed: string;
	text: string;
	textMuted: string;
	textFaint: string;
	primary: string;
	onPrimary: string;
	accent: string;
	onAccent: string;
	accentSoft: string;
	scrim: string;
	info: string;
	success: string;
	warning: string;
	danger: string;
	live: string;
}

export type TextVariant =
	| 'masthead'
	| 'display'
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'standfirst'
	| 'body'
	| 'small'
	| 'label'
	| 'meta'
	| 'button';

export type TextTone =
	| 'default'
	| 'muted'
	| 'faint'
	| 'accent'
	| 'onPrimary'
	| 'onAccent'
	| 'danger';

export interface TextVariantSpec {
	fontFamily?: string | undefined;
	fontWeight: '400' | '500' | '600' | '700';
	fontSize: number;
	lineHeight: number;
	letterSpacing?: number;
	textTransform?: 'uppercase';
	scalable: boolean;
}

/* ------------------------------------------------------------------ *
 * Settings
 *
 * Defaults and option lists live in `src/settings/constants.ts`.
 * ------------------------------------------------------------------ */

/** How the app follows the OS appearance. */
export type ColourMode = 'system' | 'light' | 'dark';

/** Reader text size for article and episode bodies. */
export type TextSize = 'small' | 'default' | 'large';

/** Which tab the app opens on. */
export type StartTab = 'home' | 'search' | 'saved';

/** The whole persisted settings document. */
export interface SettingsState {
	colourMode: ColourMode;
	textSize: TextSize;
	startTab: StartTab;
	breakingNews: boolean;
	podcastNotifications: boolean;
	downloadOnWifi: boolean;
	autoplayNext: boolean;
}

/** A key that can be changed, used by the store's `set`. */
export type SettingsKey = keyof SettingsState;

/** One choice in a picker row, e.g. `{ id: 'dark', label: 'Dark' }`. */
export interface Option<TId extends string> {
	readonly id: TId;
	readonly label: string;
}

/** The settings store contract, implemented in `src/stores/settings.store.ts`. */
export interface SettingsStore {
	/** Last committed document. */
	saved: SettingsState;
	/** Live document the UI edits. */
	draft: SettingsState;
	/** Keys where `draft` differs from `saved`. */
	changed: SettingsKey[];
	/** False until the persisted document has been read. */
	isHydrated: boolean;
	set: <TKey extends SettingsKey>(
		key: TKey,
		value: SettingsState[TKey]
	) => void;
	discard: () => void;
	save: () => void;
	hydrate: () => Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Saved items
 * ------------------------------------------------------------------ */

/** The bookmarks store, implemented in `src/stores/saved.store.ts`. */
export interface SavedStore {
	items: ContentItem[];
	isHydrated: boolean;
	isSaved: (itemId: string) => boolean;
	toggle: (item: ContentItem) => void;
	clear: () => void;
	hydrate: () => Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Audio player
 * ------------------------------------------------------------------ */

/** What the player is doing, in terms the UI cares about. */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused';

/** The player store, implemented in `src/stores/player.store.ts`. */
export interface PlayerStore {
	/** The episode currently loaded, if any. */
	current: ContentItem | null;
	/** Episodes queued behind the current one, in the order given. */
	queue: ContentItem[];
	status: PlaybackStatus;
	/** Set when setup or playback fails, so the UI can say why. */
	error: string | null;
	play: (episode: ContentItem, queue?: ContentItem[]) => Promise<void>;
	toggle: () => Promise<void>;
	stop: () => Promise<void>;
	seekTo: (seconds: number) => Promise<void>;
	/** Move by a relative offset, for the skip-back and skip-forward buttons. */
	skipBy: (seconds: number) => Promise<void>;
	next: () => Promise<void>;
	previous: () => Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Text to speech
 * ------------------------------------------------------------------ */

/**
 * The speech store, implemented in `src/stores/speech.store.ts`.
 *
 * Speech is app-wide rather than per-row: the feed recycles its rows, so a
 * hook owned by a row would stop playback the moment the speaking row scrolled
 * out of view.
 */
export interface SpeechStore {
	/** Id of the item currently being read, or `null`. */
	speakingId: string | null;
	speak: (itemId: string, text: string) => void;
	stop: () => void;
}

/* ------------------------------------------------------------------ *
 * Feed
 * ------------------------------------------------------------------ */

/** Result of the paginated feed hook. */
export interface FeedResult {
	items: ContentItem[];
	state: AsyncState<ContentItem[]>;
	/** True while a further page is being fetched. */
	isLoadingMore: boolean;
	/** True while a pull-to-refresh is in flight and the old items stay on screen. */
	isRefreshing: boolean;
	/** True when the last refresh failed and the items shown are older. */
	refreshFailed: boolean;
	hasMore: boolean;
	refresh: () => void;
	loadMore: () => void;
}

/* ------------------------------------------------------------------ *
 * Sources and recent searches
 * ------------------------------------------------------------------ */

/** The outlet and show directory, loaded once and shared by every screen. */
export interface SourcesStore {
	sources: Source[];
	status: 'idle' | 'loading' | 'success' | 'error';
	error: string | null;
	load: (force?: boolean) => Promise<void>;
}

/** Result filters on the Search tab. */
export type SearchScope = 'all' | 'stories' | 'judgments' | 'episodes';

/** Search terms the reader has submitted, newest first. */
export interface RecentSearchesStore {
	terms: string[];
	isHydrated: boolean;
	add: (term: string) => void;
	remove: (term: string) => void;
	clear: () => void;
	hydrate: () => Promise<void>;
}

/** One entry of the Home feed after the editorial hierarchy is applied. */
export type FeedEntry =
	| { kind: 'lead'; key: string; item: ContentItem }
	| { kind: 'section'; key: string; label: string }
	| { kind: 'story'; key: string; item: ContentItem }
	| { kind: 'compact'; key: string; item: ContentItem };

/** State of the update check on the App settings section. */
export type UpdateCheckResult =
	| { status: 'idle' }
	| { status: 'checking' }
	| { status: 'up_to_date'; currentVersion: string }
	| {
			status: 'update_available';
			currentVersion: string;
			latestVersion: string;
	  }
	| { status: 'error'; message: string };
