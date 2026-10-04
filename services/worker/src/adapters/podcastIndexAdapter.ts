/**
 * Podcast Index adapter — show discovery only.
 *
 * Returns a show's own RSS URL so episode ingestion can reuse `rssAdapter`.
 * Authenticated with the scheme Podcast Index documents: the `Authorization`
 * header carries `key`, `ts` and a SHA1 of key, secret and timestamp.
 *
 * Discovery is optional. With no key configured, `isConfigured` is false and
 * the worker skips it; seeded feeds still ingest.
 */

import { createHash } from 'node:crypto';

import type {
  PodcastIndexAdapter,
  PodcastIndexAdapterOptions,
  PodcastShow,
} from '../types';

const API_BASE = 'https://api.podcastindex.org/api/1.0';

interface PodcastIndexFeed {
  id?: number;
  title?: string;
  url?: string;
  link?: string;
  image?: string;
  description?: string;
}

interface PodcastIndexResponse {
  feeds?: PodcastIndexFeed[];
  /** `byfeedurl` answers with a single `feed` object rather than a list. */
  feed?: PodcastIndexFeed;
}

const toShow = (feed: PodcastIndexFeed): PodcastShow | null => {
  if (!feed.id || !feed.title || !feed.url) return null;
  return {
    podcastIndexId: feed.id,
    title: feed.title,
    feedUrl: feed.url,
    siteUrl: feed.link ?? null,
    imageUrl: feed.image ?? null,
    description: feed.description ?? null,
  };
};

export function createPodcastIndexAdapter(
  options: PodcastIndexAdapterOptions
): PodcastIndexAdapter {
  const isConfigured =
    options.apiKey.length > 0 && options.apiSecret.length > 0;

  const authorization = (): string => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hash = createHash('sha1')
      .update(`${options.apiKey}${options.apiSecret}${timestamp}`)
      .digest('hex');
    return `PodcastIndex key=${options.apiKey}, ts=${timestamp}, hash=${hash}`;
  };

  const request = async (path: string): Promise<PodcastIndexResponse> => {
    if (!isConfigured) {
      throw new Error('Podcast Index credentials are not configured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        signal: controller.signal,
        headers: {
          authorization: authorization(),
          'user-agent': 'NewzCrimeBot/1.0 (+https://newzcrime.app)',
          accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Podcast Index responded ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as PodcastIndexResponse;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    type: 'podcast_index',

    async searchShows(query: string): Promise<PodcastShow[]> {
      const body = await request(
        `/search/byterm?q=${encodeURIComponent(query)}`
      );
      return (body.feeds ?? [])
        .map(toShow)
        .filter((show): show is PodcastShow => show !== null);
    },

    async fetchShowByFeedUrl(feedUrl: string): Promise<PodcastShow | null> {
      const body = await request(
        `/podcasts/byfeedurl?url=${encodeURIComponent(feedUrl)}`
      );
      const feed = body.feeds?.[0] ?? body.feed;
      return feed ? toShow(feed) : null;
    },
  };
}

export default createPodcastIndexAdapter;
