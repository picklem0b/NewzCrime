/** One article, judgment or episode, for the detail screen. */

import type { ContentItem } from '@newzcrime/shared';

import { contentService } from '@/services/contentService';

import { useAsync } from './useAsync';
import type { UseAsyncResult } from './useAsync';

export function useItem(itemId: string): UseAsyncResult<ContentItem> {
  return useAsync<ContentItem>(
    (signal) => contentService.item(itemId, signal),
    [itemId],
    { enabled: itemId.length > 0 }
  );
}
