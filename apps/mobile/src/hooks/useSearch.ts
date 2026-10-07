import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem } from '@newzcrime/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { contentService } from '@/services/contentService';
import type { AsyncState } from '@/types';

const DEBOUNCE_MS = 350;
export const MIN_QUERY_LENGTH = 2;

export interface SearchResult {
	term: string;
	state: AsyncState<ContentItem[]>;
	isLoadingMore: boolean;
	hasMore: boolean;
	reload: () => void;
	loadMore: () => void;
}

export function useSearch(query: string): SearchResult {
	const [term, setTerm] = useState('');
	const [nonce, setNonce] = useState(0);
	const [state, setState] = useState<AsyncState<ContentItem[]>>({
		status: 'idle'
	});
	const [cursor, setCursor] = useState<string | null>(null);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const generation = useRef(0);

	useEffect(() => {
		const timer = setTimeout(() => setTerm(query.trim()), DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		const current = ++generation.current;
		setIsLoadingMore(false);

		if (term.length < MIN_QUERY_LENGTH) {
			setState({ status: 'idle' });
			setCursor(null);
			return undefined;
		}

		const controller = new AbortController();
		setState({ status: 'loading' });

		contentService
			.search(term, {
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
	}, [term, nonce]);

	const loadMore = useCallback(() => {
		if (!cursor || isLoadingMore || state.status !== 'success') return;

		const current = generation.current;
		setIsLoadingMore(true);

		contentService
			.search(term, { cursor, limit: PAGE_SIZE_DEFAULT })
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
	}, [cursor, isLoadingMore, state.status, term]);

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
