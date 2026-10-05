/** Outlets and shows for Discover, and a single source for its detail screen. */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';
import { useMemo } from 'react';

import { contentService } from '@/services/contentService';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

export function useSources(): UseAsyncResult<Source[]> {
  return useAsync<Source[]>((signal) => contentService.sources(signal), []);
}

/**
 * Lookup from source id to source. Feed items carry only `sourceId`, so rows
 * need this to show the outlet name.
 */
export function useSourceIndex(): Map<string, Source> {
  const { state } = useSources();

  return useMemo(() => {
    const index = new Map<string, Source>();
    if (state.status === 'success') {
      for (const source of state.data) index.set(source.id, source);
    }
    return index;
  }, [state]);
}

export function useSource(sourceId: string): UseAsyncResult<Source> {
  return useAsync<Source>(
    (signal) => contentService.source(sourceId, signal),
    [sourceId],
    { enabled: sourceId.length > 0 }
  );
}

/** The latest items from one source, for its detail screen. */
export function useSourceItems(
  sourceId: string
): UseAsyncResult<Paginated<ContentItem>> {
  return useAsync<Paginated<ContentItem>>(
    (signal) => contentService.sourceItems(sourceId, { signal }),
    [sourceId],
    { enabled: sourceId.length > 0 }
  );
}
