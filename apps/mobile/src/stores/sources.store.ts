import { create } from 'zustand';

import { contentService } from '@/services/contentService';
import type { SourcesStore } from '@/types';

let inflight: Promise<void> | null = null;

export const useSourcesStore = create<SourcesStore>((set, get) => ({
  sources: [],
  status: 'idle',
  error: null,

  load: async (force = false) => {
    const { status } = get();
    if (!force && (status === 'success' || status === 'loading')) {
      return inflight ?? undefined;
    }

    set({ status: 'loading', error: null });

    inflight = contentService
      .sources()
      .then((sources) => {
        set({ sources, status: 'success', error: null });
      })
      .catch((error: unknown) => {
        set({
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Could not load sources',
        });
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  },
}));