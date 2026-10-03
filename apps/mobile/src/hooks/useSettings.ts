/** Settings hooks. Screens import these rather than the store directly. */

import { useSettingsStore } from '@/stores/settings.store';
import type { SettingsKey, SettingsState, SettingsStore } from '@/types';

/** The whole settings store — use when a screen needs to read and edit. */
export const useSettings = (): SettingsStore => useSettingsStore();

/**
 * A single draft value, re-rendering only when that value changes.
 * `useSetting('colourMode')` is typed to `ColourMode`, not to the union.
 */
export function useSetting<TKey extends SettingsKey>(
  key: TKey
): SettingsState[TKey] {
  return useSettingsStore((state) => state.draft[key]);
}
