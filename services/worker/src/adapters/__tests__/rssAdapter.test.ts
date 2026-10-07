/**
 * RSS adapter tests.
 *
 * The network is mocked so the real parse path runs against recorded feeds.
 * These cover RSS 2.0 and Atom, the identifier fallbacks, date handling and the
 * media extraction that podcasts depend on.
 */

import { createHash } from 'node:crypto';

import type { Source } from '@newzcrime/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ATOM_PODCAST_FEED,
  NOT_A_FEED,
  RSS_NEWS_FEED,
} from '.././rssAdapter.fixture';

const fetchXml = vi.fn();

vi.mock('../../utils/fetchXml', () => ({
  fetchXml: (url: string, options: unknown) => fetchXml(url, options),
}));

const { createRssAdapter } = await import('.././rssAdapter');

const options = {
  userAgent: 'NewzCrimeBot/1.0 (+https://newzcrime.app)',
  timeoutMs: 5000,
};

const source: Source = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Test Feed',
  type: 'rss',
  contentType: 'article',
  feedUrl: 'https://example.co.za/feed',
  siteUrl: 'https://example.co.za',
  logoUrl: null,
  description: null,
  createdAt: '2023-01-01T00:00:00.000Z',
};

const sha1 = (value: string) =>
  createHash('sha1').update(value).digest('hex');

beforeEach(() => {
  fetchXml.mockReset();
});

describe('createRssAdapter — RSS 2.0', () => {
  it('parses the feed into normalised items, dropping unusable ones', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);

    // Five items in, three usable: no-title and no-link are dropped.
    expect(items).toHaveLength(3);
  });

  it('reads the guid as the external id', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.externalId).toBe('news-hijack-001');
  });

  it('parses pubDate into a UTC instant, not local time', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    // 15:04:05 +0200 is 13:04:05Z.
    expect(items[0]?.publishedAt).toBe('2023-01-02T13:04:05.000Z');
  });

  it('strips HTML from the excerpt and the title', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.excerpt).toBe(
      'Police said the suspect was found with an unlicensed firearm.'
    );
    expect(items[0]?.title).toBe('Man arrested for hijacking in Soweto');
  });

  it('reads dc:creator as the author', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.author).toBe('Thabo Mokoena');
  });

  it('extracts a media:content image', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.imageUrl).toBe('https://example.co.za/img/hijack.jpg');
  });

  it('leaves audio null for an article', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.audioUrl).toBeNull();
  });

  it('falls back to a hash of the normalised URL when there is no guid', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    // The same link must hash once, however the fragment or host case varies.
    const expected = sha1('https://example.co.za/news/second-story');
    expect(items[1]?.externalId).toBe(expected);
    // The stored URL keeps the original form; only the hash is normalised.
    expect(items[1]?.url).toBe('https://Example.co.za/News/Second-Story#comments');
  });

  it('dates an item with no pubDate to now, so it is never dropped', async () => {
    const before = Date.now();
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    const after = Date.now();

    const undated = items[2];
    const published = Date.parse(undated?.publishedAt ?? '');
    expect(published).toBeGreaterThanOrEqual(before - 1000);
    expect(published).toBeLessThanOrEqual(after + 1000);
  });

  it('honours the item cap', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    const items = await createRssAdapter({ ...options, maxItems: 1 }).fetchFeed(
      source
    );
    expect(items).toHaveLength(1);
  });

  it('throws when the body carries no feed', async () => {
    fetchXml.mockResolvedValue(NOT_A_FEED);
    await expect(createRssAdapter(options).fetchFeed(source)).rejects.toThrow(
      /no RSS channel or Atom feed/
    );
  });

  it('sends the user agent and a feed-appropriate accept header', async () => {
    fetchXml.mockResolvedValue(RSS_NEWS_FEED);
    await createRssAdapter(options).fetchFeed(source);

    expect(fetchXml).toHaveBeenCalledWith(
      source.feedUrl,
      expect.objectContaining({
        userAgent: options.userAgent,
        timeoutMs: options.timeoutMs,
        accept: expect.stringContaining('application/rss+xml'),
      })
    );
  });
});

describe('createRssAdapter — Atom', () => {
  it('parses entries from an Atom feed', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items).toHaveLength(2);
  });

  it('uses the alternate link, not the enclosure, as the item URL', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.url).toBe('https://pod.example/ep1');
  });

  it('uses the atom id as the external id', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.externalId).toBe('tag:pod.example,2023:1');
  });

  it('extracts the enclosure audio, which podcast playback needs', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.audioUrl).toBe('https://pod.example/audio/ep1.mp3');
  });

  it('reads the author name element', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.author).toBe('Naledi Dlamini');
  });

  it('parses published, and updated as the fallback', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[0]?.publishedAt).toBe('2023-03-05T10:00:00.000Z');
    expect(items[1]?.publishedAt).toBe('2023-03-12T10:00:00.000Z');
  });

  it('reads an entity-encoded HTML content block as the excerpt', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[1]?.excerpt).toBe('The court hands down judgment.');
  });

  it('extracts a media:thumbnail image', async () => {
    fetchXml.mockResolvedValue(ATOM_PODCAST_FEED);
    const items = await createRssAdapter(options).fetchFeed(source);
    expect(items[1]?.imageUrl).toBe('https://pod.example/ep2.jpg');
  });
});
