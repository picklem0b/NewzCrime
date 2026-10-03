import type { ReactElement } from 'react';

/**
 * Content detail — an article, judgment or podcast episode.
 *
 * The item id arrives as a query parameter because the route is static:
 *   `router.push({ pathname: '/detail/ItemDetail', params: { itemId } })`
 *
 * Renders headline, source, timestamp, excerpt and an outbound link to the
 * publisher. Full article text is not reproduced.
 *
 * TODO: render by content type, plus share and bookmark actions.
 */
export default function ItemDetailScreen(): ReactElement | null {
  return null;
}
