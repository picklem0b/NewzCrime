import { CACHE_PREFIX } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import {
  feedCacheKey,
  itemCacheKey,
  searchCacheKey,
  sourceCacheKey,
  sourceItemsCacheKey,
  sourcesCacheKey,
} from '.././cacheKeys';

describe('feedCacheKey', () => {
  it('uses the shared feed prefix so the worker can invalidate the namespace', () => {
    expect(feedCacheKey({ limit: 20 })).toMatch(
      new RegExp(`^${CACHE_PREFIX.FEED}`)
    );
  });

  it('fills in readable defaults for absent parameters', () => {
    expect(feedCacheKey({ limit: 20 })).toBe('feed:all:any:articles:first:20');
  });

  it('changes when any parameter that changes the result changes', () => {
    const base = feedCacheKey({ limit: 20 });

    expect(feedCacheKey({ limit: 20, topic: 'court' })).not.toBe(base);
    expect(feedCacheKey({ limit: 20, sourceId: 'abc' })).not.toBe(base);
    expect(feedCacheKey({ limit: 20, includePodcasts: true })).not.toBe(base);
    expect(feedCacheKey({ limit: 20, cursor: 'next' })).not.toBe(base);
    expect(feedCacheKey({ limit: 21 })).not.toBe(base);
  });

  it('separates a page of articles from the same page with podcasts', () => {
    expect(feedCacheKey({ limit: 20, includePodcasts: false })).not.toBe(
      feedCacheKey({ limit: 20, includePodcasts: true })
    );
  });

  it('is stable for the same parameters', () => {
    expect(feedCacheKey({ limit: 20, topic: 'crime', cursor: 'c' })).toBe(
      feedCacheKey({ limit: 20, topic: 'crime', cursor: 'c' })
    );
  });
});

describe('other keys', () => {
  it('namespaces each kind of value apart', () => {
    expect(itemCacheKey('1')).toBe('item:1');
    expect(sourceCacheKey('1')).toBe('sources:source:1');
    expect(sourcesCacheKey('all')).toBe('sources:all');
    expect(sourcesCacheKey('podcasts')).toBe('sources:podcasts');
  });

  it('does not collide an item with a source that share an id', () => {
    expect(itemCacheKey('same')).not.toBe(sourceCacheKey('same'));
  });

  it('does not collide an outlet list with a podcast list', () => {
    expect(sourcesCacheKey('all')).not.toBe(sourcesCacheKey('podcasts'));
  });

  it('varies a source page with its cursor and limit', () => {
    const base = sourceItemsCacheKey('s1', { limit: 20 });

    expect(sourceItemsCacheKey('s1', { limit: 20, cursor: 'c' })).not.toBe(base);
    expect(sourceItemsCacheKey('s1', { limit: 21 })).not.toBe(base);
    expect(sourceItemsCacheKey('s2', { limit: 20 })).not.toBe(base);
  });
});

describe('searchCacheKey', () => {
  it('ignores case and surrounding whitespace, which do not change results', () => {
    expect(searchCacheKey({ query: 'Court', limit: 20 })).toBe(
      searchCacheKey({ query: '  court  ', limit: 20 })
    );
  });

  it('varies with the cursor and limit', () => {
    const base = searchCacheKey({ query: 'court', limit: 20 });

    expect(searchCacheKey({ query: 'court', limit: 20, cursor: 'c' })).not.toBe(base);
    expect(searchCacheKey({ query: 'court', limit: 21 })).not.toBe(base);
  });

  it('keeps different queries apart', () => {
    expect(searchCacheKey({ query: 'court', limit: 20 })).not.toBe(
      searchCacheKey({ query: 'crime', limit: 20 })
    );
  });
});
