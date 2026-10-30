/** The latest stories, episodes and videos from followed sources. */

import type { ContentItem, Paginated } from '@newzcrime/shared';
import { useMemo } from 'react';

import { contentService } from '@/services/contentService';
import { useFollowingStore } from '@/stores/following.store';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

export interface FollowingFeedResult extends UseAsyncResult<
	Paginated<ContentItem>
> {
	sourceIds: string[];
}

/**
 * One page across every followed source.
 *
 * The API accepts a comma-separated list, so following twelve outlets still
 * costs one request rather than twelve. The list is sorted before it is sent:
 * follow order is a UI concern, and unsorted ids would make two identical
 * requests miss the same cache entry.
 */
export function useFollowingFeed(limit = 8): FollowingFeedResult {
	const sourceIds = useFollowingStore(state => state.sourceIds);
	const sortedKey = useMemo(() => [...sourceIds].sort().join(','), [sourceIds]);
	const sorted = useMemo(
		() => (sortedKey.length > 0 ? sortedKey.split(',') : []),
		[sortedKey]
	);

	const result = useAsync<Paginated<ContentItem>>(
		signal =>
			contentService.feed({
				sourceIds: sorted,
				includePodcasts: true,
				includeVideos: true,
				limit,
				signal
			}),
		[sortedKey, limit],
		{ enabled: sorted.length > 0 }
	);

	return { ...result, sourceIds };
}
