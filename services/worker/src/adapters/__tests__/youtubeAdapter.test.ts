/**
 * YouTube adapter tests.
 *
 * The channel Atom feed is the only public ingestion surface, so its media
 * namespace and identifier rules are pinned here. A regression would either
 * drop every video or store one without a playable id.
 */

import type { Source } from '@newzcrime/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NOT_A_YOUTUBE_FEED, YOUTUBE_FEED } from '../youtubeAdapter.fixture';

const fetchXml = vi.fn();

vi.mock('../../utils/fetchXml', () => ({
  fetchXml: (url: string, options: unknown) => fetchXml(url, options),
}));

const { createYoutubeAdapter } = await import('../youtubeAdapter');

const options = {
  userAgent: 'NewzCrimeBot/1.0 (+https://newzcrime.app)',
  timeoutMs: 5000,
};

const source: Source = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'MDNtv',
  type: 'youtube',
  contentType: 'video',
  feedUrl:
    'https://www.youtube.com/feeds/videos.xml?channel_id=UClWk6DQBYHf6rLP8VtMn0Xw',
  siteUrl: 'https://www.youtube.com/@MDNtv',
  logoUrl: null,
  description: null,
  province: null,
  category: 'courts',
  createdAt: '2023-01-01T00:00:00.000Z',
};

beforeEach(() => {
  fetchXml.mockReset();
});

describe('createYoutubeAdapter', () => {
  it('keeps usable entries and drops one without a video id', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items).toHaveLength(2);
    expect(items[0]?.externalId).toBe('k4lBt2AhgIs');
  });

  it('builds a canonical watch URL instead of trusting link variants', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[0]?.url).toBe('https://www.youtube.com/watch?v=k4lBt2AhgIs');
  });

  it('decodes the title but keeps the live marker', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[0]?.title).toBe('🔴 LIVE | COURT CASE & FRAUD | 29 OCT 2026');
  });

  it('preserves paragraph breaks in the description', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[0]?.excerpt).toContain('\n\n');
    expect(items[0]?.excerpt).toContain('All accused are presumed innocent.');
  });

  it('reads view and like counts', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[0]?.viewCount).toBe(18_432);
    expect(items[0]?.likeCount).toBe(712);
  });

  it('falls back to a deterministic thumbnail when media is absent', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[1]?.imageUrl).toBe(
      'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg'
    );
  });

  it('uses the channel name when an entry has no author', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter(options).fetchFeed(source);

    expect(items[1]?.author).toBe('MDNtv');
  });

  it('rejects a feed that is not YouTube Atom', async () => {
    fetchXml.mockResolvedValue(NOT_A_YOUTUBE_FEED);
    await expect(
      createYoutubeAdapter(options).fetchFeed(source)
    ).rejects.toThrow(/no YouTube Atom feed/);
  });

  it('honours the item cap', async () => {
    fetchXml.mockResolvedValue(YOUTUBE_FEED);
    const items = await createYoutubeAdapter({
      ...options,
      maxItems: 1,
    }).fetchFeed(source);

    expect(items).toHaveLength(1);
  });
});
