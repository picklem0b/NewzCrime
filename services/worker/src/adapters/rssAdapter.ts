/**
 * RSS adapter — news articles and podcast episodes.
 *
 * Adapters do not touch the database: `fetchFeed` takes a `sources` row and
 * returns normalised items, and the job layer owns persistence and
 * de-duplication.
 */

import type { NormalizedItem, Source } from '@newzcrime/shared';
import type { SourceAdapter } from '../types';

export const rssAdapter: SourceAdapter = {
  type: 'rss',

  async fetchFeed(source: Source): Promise<NormalizedItem[]> {
    // TODO: fetch and parse RSS/Atom, normalise entries, strip HTML and store
    // excerpts only.
    void source;
    return [];
  },
};

export default rssAdapter;
