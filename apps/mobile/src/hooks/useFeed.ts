import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { contentService } from '@/services/contentService';
import {
	FEED_STALE_PAINT_MS,
	clearFeed,
	feedCacheKey,
	readDiskFeed,
	readMemoryFeed,
	writeFeed
} from '@/services/feedCache';
import type { AsyncState, FeedResult } from '@/types';

export interface UseFeedOptions {
	topic: Topic;
	includePodcasts?: boolean;
}

const messageOf = (error: unknown): string =>
	error instanceof Error ? error.message : 'Could not load the feed';

export function useFeed({
	topic,
	includePodcasts = false
}: UseFeedOptions): FeedResult {
	// Read the cache during the first render rather than in an effect. An effect
	// runs after paint, which is one frame of skeleton even when a full page is
	// already in memory from onboarding or the boot route.
	const [initial] = useState(() =>
		readMemoryFeed(
			feedCacheKey(topic, includePodcasts),
			Date.now(),
			FEED_STALE_PAINT_MS
		)
	);
	const [items, setItems] = useState<ContentItem[]>(initial?.items ?? []);
	const [state, setState] = useState<AsyncState<ContentItem[]>>(
		initial
			? { status: 'success', data: initial.items }
			: { status: 'loading' }
	);
	const [cursor, setCursor] = useState<string | null>(
		initial?.nextCursor ?? null
	);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshFailed, setRefreshFailed] = useState(false);
	const [nonce, setNonce] = useState(0);
	const generation = useRef(0);
	const hasItems = useRef(false);
	const refreshRequested = useRef(false);

	hasItems.current = items.length > 0;

	useEffect(() => {
		const controller = new AbortController();
		const current = ++generation.current;
		const isRefresh = refreshRequested.current && hasItems.current;
		const cacheKey = feedCacheKey(topic, includePodcasts);
		refreshRequested.current = false;

		if (isRefresh) {
			setIsRefreshing(true);
		} else {
			// Paint the cached page first: it is already in memory on a tab
			// switch, so Today appears without a skeleton and without a request.
			const cached = readMemoryFeed(
				cacheKey,
				Date.now(),
				FEED_STALE_PAINT_MS
			);
			if (cached) {
				setItems(cached.items);
				setCursor(cached.nextCursor);
				setState({ status: 'success', data: cached.items });
			} else {
				setState({ status: 'loading' });
				setItems([]);
				setCursor(null);
			}
		}
		setRefreshFailed(false);
		setIsLoadingMore(false);

		contentService
			.feed({
				topic,
				includePodcasts,
				limit: PAGE_SIZE_DEFAULT,
				signal: controller.signal
			})
			.then(page => {
				if (generation.current !== current) return;
				setItems(page.items);
				setCursor(page.nextCursor);
				setState({ status: 'success', data: page.items });
				setIsRefreshing(false);
				if (page.items.length > 0) {
					writeFeed(cacheKey, page.items, page.nextCursor);
				} else {
					clearFeed(cacheKey);
				}
			})
			.catch(async (error: unknown) => {
				if (generation.current !== current || controller.signal.aborted)
					return;

				setIsRefreshing(false);

				if (isRefresh) {
					setRefreshFailed(true);
					return;
				}

				// A cold start with no network can still show the last page.
				const cached = await readDiskFeed(cacheKey, FEED_STALE_PAINT_MS);
				if (generation.current !== current) return;

				if (cached) {
					setItems(cached.items);
					setCursor(cached.nextCursor);
					setState({ status: 'success', data: cached.items });
					setRefreshFailed(true);
					return;
				}

				setState({ status: 'error', error: messageOf(error) });
			});

		return () => {
			controller.abort();
		};
	}, [topic, includePodcasts, nonce]);

	const loadMore = useCallback(() => {
		if (!cursor || isLoadingMore || isRefreshing) return;

		const current = generation.current;
		setIsLoadingMore(true);

		contentService
			.feed({ topic, includePodcasts, cursor, limit: PAGE_SIZE_DEFAULT })
			.then(page => {
				if (generation.current !== current) return;
				setItems(previous => {
					const known = new Set(previous.map(item => item.id));
					return [
						...previous,
						...page.items.filter(item => !known.has(item.id))
					];
				});
				setCursor(page.nextCursor);
			})
			.catch(() => undefined)
			.finally(() => {
				if (generation.current === current) setIsLoadingMore(false);
			});
	}, [cursor, isLoadingMore, isRefreshing, topic, includePodcasts]);

	const refresh = useCallback(() => {
		refreshRequested.current = true;
		setNonce(value => value + 1);
	}, []);

	return {
		items,
		state,
		isLoadingMore,
		isRefreshing,
		refreshFailed,
		hasMore: cursor !== null,
		refresh,
		loadMore
	};
}
