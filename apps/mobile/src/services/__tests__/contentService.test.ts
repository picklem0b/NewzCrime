/**
 * Content service tests.
 *
 * These pin the request each helper makes: path, query keys and how flags are
 * encoded. The API client is mocked, so a wrong path is caught here rather than
 * as a 404 in the app.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('.././apiService', () => ({
  apiClient: { get },
  apiBaseUrl: 'http://example.test',
}));

const { contentService } = await import('.././contentService');

const lastCall = () => get.mock.calls[0] as [string, { query?: unknown }];

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({});
});

describe('contentService.feed', () => {
  it('defaults the topic to `all` so the API never sees a missing filter', async () => {
    await contentService.feed();
    const [path, options] = lastCall();

    expect(path).toBe('/v1/feed');
    expect(options.query).toMatchObject({ topic: 'all' });
  });

  it('passes the chosen topic through', async () => {
    await contentService.feed({ topic: 'court' });
    expect(lastCall()[1].query).toMatchObject({ topic: 'court' });
  });

  it('encodes includePodcasts as `1`, and omits it when false', async () => {
    await contentService.feed({ includePodcasts: true });
    expect(lastCall()[1].query).toMatchObject({ includePodcasts: '1' });

    get.mockClear();
    await contentService.feed({ includePodcasts: false });
    expect(lastCall()[1].query).toMatchObject({ includePodcasts: undefined });
  });

  it('forwards the abort signal', async () => {
    const controller = new AbortController();
    await contentService.feed({ signal: controller.signal });

    const [, options] = lastCall() as [string, { signal?: AbortSignal }];
    expect(options.signal).toBe(controller.signal);
  });
});

describe('contentService paths', () => {
  it('interpolates an item id', async () => {
    await contentService.item('item-7');
    expect(lastCall()[0]).toBe('/v1/items/item-7');
  });

  it('lists sources and podcasts from their own endpoints', async () => {
    await contentService.sources();
    expect(lastCall()[0]).toBe('/v1/sources');

    get.mockClear();
    await contentService.podcasts();
    expect(lastCall()[0]).toBe('/v1/podcasts');
  });

  it('interpolates a source id for its items', async () => {
    await contentService.sourceItems('src-3', { cursor: 'c1', limit: 10 });
    const [path, options] = lastCall();

    expect(path).toBe('/v1/sources/src-3/items');
    expect(options.query).toMatchObject({ cursor: 'c1', limit: 10 });
  });

  it('sends the search term as `q`', async () => {
    await contentService.search('madlanga');
    const [path, options] = lastCall();

    expect(path).toBe('/v1/search');
    expect(options.query).toMatchObject({ q: 'madlanga' });
  });
});
