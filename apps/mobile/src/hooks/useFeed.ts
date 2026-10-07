import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { contentService } from '@/services/contentService';
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
	const [items, setItems] = useState<ContentItem[]>([]);
	const [state, setState] = useState<AsyncState<ContentItem[]>>({
		status: 'loading'
	});
	const [cursor, setCursor] = useState<string | null>(null);
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
		refreshRequested.current = false;

		if (isRefresh) {
			setIsRefreshing(true);
		} else {
			setState({ status: 'loading' });
			setItems([]);
			setCursor(null);
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
			})
			.catch((error: unknown) => {
				if (generation.current !== current || controller.signal.aborted)
					return;
				setIsRefreshing(false);
				if (isRefresh) {
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
