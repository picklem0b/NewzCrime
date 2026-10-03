/**
 * Settings store (zustand).
 *
 * `saved` is the committed document and `draft` is what the UI edits; `changed`
 * lists the keys that differ. Saving copies `draft` onto `saved`, so a screen
 * can present changes and commit them together.
 *
 * TODO: persist `saved` between launches and hydrate it on startup.
 */

import { create } from 'zustand';

import { defaultSettings } from '@/settings/constants';
import type { SettingsKey, SettingsState, SettingsStore } from '@/types';

const diff = (saved: SettingsState, draft: SettingsState): SettingsKey[] =>
  (Object.keys(draft) as SettingsKey[]).filter(
    (key) => draft[key] !== saved[key]
  );

export const useSettingsStore = create<SettingsStore>((set) => ({
  saved: defaultSettings,
  draft: defaultSettings,
  changed: [],

  set: <TKey extends SettingsKey>(key: TKey, value: SettingsState[TKey]) =>
    set((state) => {
      const draft = { ...state.draft, [key]: value } as SettingsState;
      return { draft, changed: diff(state.saved, draft) };
    }),

  discard: () => set((state) => ({ draft: state.saved, changed: [] })),

  save: () =>
    set((state) => {
      const saved = state.draft;
      return { saved, changed: diff(saved, state.draft) };
    }),
}));
