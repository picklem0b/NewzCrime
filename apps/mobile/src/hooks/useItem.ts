/** One article, judgment or episode, for the detail screen. */

import type { ContentItem } from '@newzcrime/shared';

import { contentService } from '@/services/contentService';
import type { AsyncState } from '@/types';

import { useAsync } from './useAsync';

export function useItem(itemId: string): AsyncState<ContentItem> {
  const { state } = useAsync<ContentItem>(
    (signal) => contentService.item(itemId, signal),
    [itemId]
  );
  return state;
}
