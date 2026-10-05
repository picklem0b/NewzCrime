/**
 * Debounced search over stored items.
 *
 * The query is debounced before it reaches the API, because search hits the
 * database and the rate limiter counts every request.
 */

import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem, Paginated } from '@newzcrime/shared';
import { useCallback, useEffect, useState } from 'react';

import { contentService } from '@/services/contentService';
import type { AsyncState } from '@/types';

import type { UseAsyncResult } from './useAsync';

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function useSearch(
  query: string
): UseAsyncResult<Paginated<ContentItem>> {
  const [debounced, setDebounced] = useState(query);
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<AsyncState<Paginated<ContentItem>>>({
    status: 'idle',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced.length < MIN_QUERY_LENGTH) {
      setState({ status: 'idle' });
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;
    setState({ status: 'loading' });

    contentService
      .search(debounced, { limit: PAGE_SIZE_DEFAULT, signal: controller.signal })
      .then((page) => {
        if (isActive) setState({ status: 'success', data: page });
      })
      .catch((error: unknown) => {
        if (!isActive || controller.signal.aborted) return;
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Search failed',
        });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [debounced, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { state, reload };
}
