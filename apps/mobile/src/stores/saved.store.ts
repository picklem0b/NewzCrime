/**
 * Bookmark store (zustand).
 *
 * A saved item keeps a snapshot of the item, not just its id, because a
 * podcast episode has to stay playable with no network. The snapshot is
 * trimmed to the fields the UI renders. Accounts are a later phase; until then
 * the list lives on the device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentItem } from '@newzcrime/shared';
import { create } from 'zustand';

import type { SavedStore } from '@/types';

const STORAGE_KEY = 'newzcrime.saved.v1';

/** Upper bound, so the store cannot grow without limit. */
const MAX_SAVED = 500;

const persist = (items: ContentItem[]): void => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const useSavedStore = create<SavedStore>((set, get) => ({
  items: [],
  isHydrated: false,

  isSaved: (itemId) => get().items.some((item) => item.id === itemId),

  toggle: (item) => {
    const exists = get().items.some((saved) => saved.id === item.id);
    const items = exists
      ? get().items.filter((saved) => saved.id !== item.id)
      : [item, ...get().items].slice(0, MAX_SAVED);

    set({ items });
    persist(items);
  },

  clear: () => {
    set({ items: [] });
    void AsyncStorage.removeItem(STORAGE_KEY);
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ContentItem[]) : [];
      set({ items: Array.isArray(parsed) ? parsed : [], isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
