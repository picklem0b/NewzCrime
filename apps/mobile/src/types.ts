/**
 * Types the app declares for itself, settings included. Shapes that cross the
 * network come from `@newzcrime/shared`; the values that fill these types live
 * in the matching `constants.ts`.
 */

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
 * Settings
 *
 * The settings sections are not final, so these fields may change.
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
  set: <TKey extends SettingsKey>(
    key: TKey,
    value: SettingsState[TKey]
  ) => void;
  discard: () => void;
  save: () => void;
}
