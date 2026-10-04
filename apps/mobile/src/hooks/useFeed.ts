/**
 * The paginated Home feed.
 *
 * First page and page loading are separate, because "no items yet" and
 * "fetching the next page" are different states. Changing the topic starts a
 * fresh feed rather than appending to the old one.
 */

import { PAGE_SIZE_DEFAULT } from '@newzcrime/shared';
import type { ContentItem, Topic } from '@newzcrime/shared';
import { useCallback, useEffect, useState } from 'react';

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
  includePodcasts = false,
}: UseFeedOptions): FeedResult {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [state, setState] = useState<AsyncState<ContentItem[]>>({
    status: 'loading',
  });
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({ status: 'loading' });
    setItems([]);
    setCursor(null);

    contentService
      .feed({
        topic,
        includePodcasts,
        limit: PAGE_SIZE_DEFAULT,
        signal: controller.signal,
      })
      .then((page) => {
        if (!isActive) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setState({ status: 'success', data: page.items });
      })
      .catch((error: unknown) => {
        if (!isActive || controller.signal.aborted) return;
        setState({ status: 'error', error: messageOf(error) });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [topic, includePodcasts, nonce]);

  const loadMore = useCallback(() => {
    if (!cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    contentService
      .feed({ topic, includePodcasts, cursor, limit: PAGE_SIZE_DEFAULT })
      .then((page) => {
        setItems((previous) => [...previous, ...page.items]);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        // A failed follow-up page is not worth destroying the loaded feed.
      })
      .finally(() => setIsLoadingMore(false));
  }, [cursor, isLoadingMore, topic, includePodcasts]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return {
    items,
    state,
    isLoadingMore,
    hasMore: cursor !== null,
    refresh,
    loadMore,
  };
}
