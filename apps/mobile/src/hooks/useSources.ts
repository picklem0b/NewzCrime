import type { ContentItem, Paginated, Source } from '@newzcrime/shared';
import { useEffect, useMemo } from 'react';

import { contentService } from '@/services/contentService';
import { useSourcesStore } from '@/stores/sources.store';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

export function useSources() {
	const sources = useSourcesStore(state => state.sources);
	const status = useSourcesStore(state => state.status);
	const error = useSourcesStore(state => state.error);
	const load = useSourcesStore(state => state.load);

	useEffect(() => {
		void load();
	}, [load]);

	const reload = () => {
		void load(true);
	};

	return { sources, status, error, reload };
}

export function useSourceIndex(): Map<string, Source> {
	const sources = useSourcesStore(state => state.sources);
	const load = useSourcesStore(state => state.load);

	useEffect(() => {
		void load();
	}, [load]);

	return useMemo(() => {
		const index = new Map<string, Source>();
		for (const source of sources) index.set(source.id, source);
		return index;
	}, [sources]);
}

export function useSource(sourceId: string): UseAsyncResult<Source> {
	return useAsync<Source>(
		signal => contentService.source(sourceId, signal),
		[sourceId],
		{ enabled: sourceId.length > 0 }
	);
}

export function useSourceItems(
	sourceId: string
): UseAsyncResult<Paginated<ContentItem>> {
	return useAsync<Paginated<ContentItem>>(
		signal => contentService.sourceItems(sourceId, { signal }),
		[sourceId],
		{ enabled: sourceId.length > 0 }
	);
}
