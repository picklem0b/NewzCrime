/** Full article text for an item, extracted by the API on first use. */

import type { ItemContent } from '@newzcrime/shared';

import type { AsyncState } from '@/types';
import { contentService } from '@/services/contentService';

import { useAsync } from './useAsync';

export interface ItemContentResult {
  state: AsyncState<ItemContent>;
  reload: () => void;
}

/**
 * `enabled` is false for episodes, videos and items that are still loading, so
 * the API is never asked for a body it cannot produce.
 */
export function useItemContent(
  itemId: string,
  enabled: boolean
): ItemContentResult {
  return useAsync<ItemContent>(
    (signal) => contentService.itemContent(itemId, signal),
    [itemId],
    { enabled: enabled && itemId.length > 0 }
  );
}
