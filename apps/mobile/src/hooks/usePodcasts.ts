/** The curated podcast shows, and the episodes for one show. */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';

import { contentService } from '@/services/contentService';
import type { AsyncState } from '@/types';

import { useAsync } from './useAsync';

export function usePodcastShows(): AsyncState<Source[]> {
  const { state } = useAsync<Source[]>(
    (signal) => contentService.podcasts(signal),
    []
  );
  return state;
}

export function useShowEpisodes(
  sourceId: string
): AsyncState<Paginated<ContentItem>> {
  const { state } = useAsync<Paginated<ContentItem>>(
    (signal) => contentService.sourceItems(sourceId, { signal }),
    [sourceId]
  );
  return state;
}
