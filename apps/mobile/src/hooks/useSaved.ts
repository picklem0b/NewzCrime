/** Bookmarks. Screens read through these rather than the store directly. */

import { useSavedStore } from '@/stores/saved.store';
import type { SavedStore } from '@/types';

export function useSaved(): SavedStore {
  return useSavedStore();
}

/** Whether one item is bookmarked. Re-renders only when that answer changes. */
export function useIsSaved(itemId: string): boolean {
  return useSavedStore((state) =>
    state.items.some((item) => item.id === itemId)
  );
}
