import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem, ContentType, ItemTopic, Source } from '@newzcrime/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { contentService } from '@/services/contentService';
import type { AsyncState, SearchSort } from '@/types';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

const DEBOUNCE_MS = 350;
export const MIN_QUERY_LENGTH = 2;

export interface SearchOptions {
	/** Exact content type derived from the active scope. */
	type?: ContentType | undefined;
	topic?: ItemTopic | undefined;
	sourceIds?: string[] | undefined;
	/** ISO lower bound, inclusive. */
	from?: string | undefined;
	/** ISO upper bound, inclusive. */
	to?: string | undefined;
	sort?: SearchSort | undefined;
	/** False for the Channels scope, which only searches the directory. */
	enabled?: boolean;
}

export interface SearchResult {
	term: string;
	state: AsyncState<ContentItem[]>;
	isLoadingMore: boolean;
	hasMore: boolean;
	reload: () => void;
	loadMore: () => void;
}

export function useSearch(
	query: string,
	options: SearchOptions = {}
): SearchResult {
	const [term, setTerm] = useState('');
	const [nonce, setNonce] = useState(0);
	const [state, setState] = useState<AsyncState<ContentItem[]>>({
		status: 'idle'
	});
	const [cursor, setCursor] = useState<string | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const generation = useRef(0);

	const {
		type,
		topic,
		from,
		to,
		sort,
		enabled = true
	} = options;
	const sourceKey = options.sourceIds?.join(',') ?? '';

	// The caller builds the date bounds and the followed-source list, but the
	// array identity changes on every render. A stable key keeps the request
	// from restarting while the user scrolls.
	const filters = useMemo(
		() => ({
			type,
			topic,
			from,
			to,
			sort,
			enabled,
			sourceIds: sourceKey.length > 0 ? sourceKey.split(',') : undefined
		}),
		[type, topic, from, to, sort, enabled, sourceKey]
	);

	useEffect(() => {
		const timer = setTimeout(() => setTerm(query.trim()), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		const current = ++generation.current;
		setIsLoadingMore(false);

		if (!filters.enabled || term.length < MIN_QUERY_LENGTH) {
			setState({ status: 'idle' });
			setCursor(null);
			return undefined;
		}

		const controller = new AbortController();
		setState({ status: 'loading' });

		contentService
			.search(term, {
				type: filters.type,
				topic: filters.topic,
				sourceIds: filters.sourceIds,
				from: filters.from,
				to: filters.to,
				sort: filters.sort,
				limit: PAGE_SIZE_DEFAULT,
				signal: controller.signal
			})
			.then(page => {
				if (generation.current !== current) return;
				setState({ status: 'success', data: page.items });
				setCursor(page.nextCursor);
			})
			.catch((error: unknown) => {
				if (generation.current !== current || controller.signal.aborted)
					return;
				setState({
					status: 'error',
					error:
						error instanceof Error ? error.message : 'Search failed'
				});
			});

		return () => controller.abort();
	}, [term, nonce, filters]);

	const loadMore = useCallback(() => {
		if (!cursor || isLoadingMore || state.status !== 'success') return;
		if (!filters.enabled) return;

		const current = generation.current;
		setIsLoadingMore(true);

		contentService
			.search(term, {
				type: filters.type,
				topic: filters.topic,
				sourceIds: filters.sourceIds,
				from: filters.from,
				to: filters.to,
				sort: filters.sort,
				cursor,
				limit: PAGE_SIZE_DEFAULT
			})
			.then(page => {
				if (generation.current !== current) return;
				setState(previous => {
					if (previous.status !== 'success') return previous;
					const known = new Set(previous.data.map(item => item.id));
					return {
						status: 'success',
						data: [
							...previous.data,
							...page.items.filter(item => !known.has(item.id))
						]
					};
				});
				setCursor(page.nextCursor);
			})
			.catch(() => undefined)
			.finally(() => {
				if (generation.current === current) setIsLoadingMore(false);
			});
	}, [cursor, filters, isLoadingMore, state.status, term]);

	const reload = useCallback(() => setNonce(value => value + 1), []);

	return {
		term,
		state,
		isLoadingMore,
		hasMore: cursor !== null,
		reload,
		loadMore
	};
}

/**
 * Directory search for channels, shows and outlets.
 *
 * It shares the same debounce as item search so a query produces one request
 * per pause, not one per keystroke.
 */
export function useSourceSearch(
	query: string,
	enabled = true
): UseAsyncResult<Source[]> {
	const [term, setTerm] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setTerm(query.trim()), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	return useAsync<Source[]>(
		signal => contentService.searchSources(term, signal),
		[term],
		{ enabled: enabled && term.length >= MIN_QUERY_LENGTH }
	);
}
