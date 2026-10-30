/** Video channels and the videos shown on the Watch tab. */

import type { ContentItem, Paginated, Source } from '@newzcrime/shared';

import { contentService } from '@/services/contentService';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

/** Every channel, independent of whether it has a video in the current page. */
export function useVideoChannels(): UseAsyncResult<Source[]> {
  return useAsync<Source[]>((signal) => contentService.videoChannels(signal), []);
}

/**
 * The newest videos across all channels.
 *
 * `limit=100` is enough for the shelf's rails; the detail screen pages a
 * single channel separately, so a busy news day cannot bury a niche show.
 */
export function useVideoFeed(
  limit = 100
): UseAsyncResult<Paginated<ContentItem>> {
  return useAsync<Paginated<ContentItem>>(
    (signal) => contentService.videos({ limit, signal }),
    [limit]
  );
}

export function useChannelVideos(
  sourceId: string | null
): UseAsyncResult<Paginated<ContentItem>> {
  return useAsync<Paginated<ContentItem>>(
    (signal) => contentService.sourceItems(sourceId ?? '', { signal }),
    [sourceId],
    { enabled: sourceId !== null && sourceId.length > 0 }
  );
}
