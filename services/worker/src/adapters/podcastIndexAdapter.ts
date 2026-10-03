/**
 * Podcast Index adapter — show discovery only. It returns a show's feed URL so
 * episode ingestion can reuse `rssAdapter`.
 *
 * TODO: sign requests, search shows by term and resolve a show by feed URL.
 */

import type { PodcastIndexAdapter, PodcastShow } from '../types';

export const podcastIndexAdapter: PodcastIndexAdapter = {
  type: 'podcast_index',

  async searchShows(query: string): Promise<PodcastShow[]> {
    void query;
    return [];
  },

  async fetchShowByFeedUrl(feedUrl: string): Promise<PodcastShow | null> {
    void feedUrl;
    return null;
  },
};

export default podcastIndexAdapter;
