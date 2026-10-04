/**
 * Types the app declares for itself, settings included. Shapes that cross the
 * network come from `@newzcrime/shared`; the values that fill these types live
 * in the matching `constants.ts`.
 */

import type { ContentItem } from '@newzcrime/shared';
import type { ViewStyle } from 'react-native';

/** Every screen in `src/app` accepts this. */
export interface ScreenProps {
  style?: ViewStyle;
}

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
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  onAccent: string;
  live: string;
  success: string;
  warning: string;
  danger: string;
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
export type StartTab = 'home' | 'discover' | 'saved';

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
 * Feed
 * ------------------------------------------------------------------ */

/** Result of the paginated feed hook. */
export interface FeedResult {
  items: ContentItem[];
  state: AsyncState<ContentItem[]>;
  /** True while a further page is being fetched. */
  isLoadingMore: boolean;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
}

/** State of the update check on the App settings section. */
export type UpdateCheckResult =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'up_to_date'; currentVersion: string }
  | { status: 'update_available'; currentVersion: string; latestVersion: string }
  | { status: 'error'; message: string };
