/**
 * Settings values: defaults, the lists a picker renders, and label lookups.
 *
 * Values only — no components, no state, no React. Every list is typed against
 * the matching union in `@/types`, so a typo is a compile error.
 */

import type {
  ColourMode,
  Option,
  SettingsKey,
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

export const colourModes: ReadonlyArray<Option<ColourMode>> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export const textSizes: ReadonlyArray<Option<TextSize>> = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
];

export const startTabs: ReadonlyArray<Option<StartTab>> = [
  { id: 'home', label: 'Home' },
  { id: 'discover', label: 'Discover' },
  { id: 'saved', label: 'Saved' },
];

/** Human label for every setting, used by the row components. */
export const fieldLabels: Record<SettingsKey, string> = {
  colourMode: 'Appearance',
  textSize: 'Text size',
  startTab: 'Open on',
  breakingNews: 'Breaking news alerts',
  podcastNotifications: 'New episode alerts',
  downloadOnWifi: 'Download over Wi-Fi only',
  autoplayNext: 'Autoplay next episode',
};

/** Render a stored value as the text a row shows on its right-hand side. */
export function formatValue(
  key: SettingsKey,
  value: SettingsState[SettingsKey]
): string {
  switch (key) {
    case 'colourMode':
      return findLabel(colourModes, value as ColourMode);
    case 'textSize':
      return findLabel(textSizes, value as TextSize);
    case 'startTab':
      return findLabel(startTabs, value as StartTab);
    default:
      return value ? 'On' : 'Off';
  }
}

function findLabel<TId extends string>(
  options: ReadonlyArray<Option<TId>>,
  id: TId
): string {
  return options.find((option) => option.id === id)?.label ?? '';
}
