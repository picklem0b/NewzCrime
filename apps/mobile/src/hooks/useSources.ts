/** Outlets and shows for Discover, and a single source for its detail screen. */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';
import { useMemo } from 'react';

import { contentService } from '@/services/contentService';
import type { AsyncState } from '@/types';

import { useAsync } from './useAsync';

export function useSources(): AsyncState<Source[]> {
  const { state } = useAsync<Source[]>(
    (signal) => contentService.sources(signal),
    []
  );
  return state;
}

/**
 * Lookup from source id to source. Feed items carry only `sourceId`, so rows
 * need this to show the outlet name.
 */
export function useSourceIndex(): Map<string, Source> {
  const state = useSources();

  return useMemo(() => {
    const index = new Map<string, Source>();
    if (state.status === 'success') {
      for (const source of state.data) index.set(source.id, source);
    }
    return index;
  }, [state]);
}

export function useSource(sourceId: string): AsyncState<Source> {
  const { state } = useAsync<Source>(
    (signal) => contentService.source(sourceId, signal),
    [sourceId]
  );
  return state;
}

/** The latest items from one source, for its detail screen. */
export function useSourceItems(
  sourceId: string
): AsyncState<Paginated<ContentItem>> {
  const { state } = useAsync<Paginated<ContentItem>>(
    (signal) => contentService.sourceItems(sourceId, { signal }),
    [sourceId]
  );
  return state;
}
