/** The curated podcast shows, and the episodes for one show. */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';

import { contentService } from '@/services/contentService';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

export function usePodcastShows(): UseAsyncResult<Source[]> {
  return useAsync<Source[]>((signal) => contentService.podcasts(signal), []);
}

/**
 * Episodes for one show.
 *
 * `sourceId` is `null` until the shows have loaded, and the request is skipped
 * while it is, rather than asking the API for the items of an empty id.
 */
export function useShowEpisodes(
  sourceId: string | null
): UseAsyncResult<Paginated<ContentItem>> {
  return useAsync<Paginated<ContentItem>>(
    (signal) => contentService.sourceItems(sourceId ?? '', { signal }),
    [sourceId],
    { enabled: sourceId !== null && sourceId.length > 0 }
  );
}
