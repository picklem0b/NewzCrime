/**
 * Settings values: the defaults and the lists a picker renders.
 *
 * Values only — no components, no state, no React. Every list is typed against
 * the matching union in `@/types`, so a typo is a compile error.
 */

import type {
  ColourMode,
  Option,
  SettingsState,
  StartTab,
  TextSize,
} from '@/types';

export const defaultSettings: SettingsState = {
  colourMode: 'system',
  textSize: 'default',
  startTab: 'home',
  breakingNews: true,
  podcastNotifications: true,
  downloadOnWifi: true,
  autoplayNext: false,
};

export const colourModes: readonly Option<ColourMode>[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export const textSizes: readonly Option<TextSize>[] = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

export const startTabs: readonly Option<StartTab>[] = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'saved', label: 'Saved' },
];
