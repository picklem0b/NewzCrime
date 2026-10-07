import { describe, expect, it } from 'vitest';

import {
  APP_RELEASE,
  CACHE_PREFIX,
  CACHE_TTL,
  CONTENT_TYPE,
  ITEM_TOPICS,
  ITEM_TOPIC,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  RELEASE_NOTES,
  SOURCE_TYPE,
  TOPIC,
} from '.././constants';

describe('content and source types', () => {
  it('names the three content kinds the release ships', () => {
    expect(CONTENT_TYPE.ARTICLE).toBe('article');
    expect(CONTENT_TYPE.COURT_RULING).toBe('court_ruling');
    expect(CONTENT_TYPE.PODCAST_EPISODE).toBe('podcast_episode');
  });

  it('gives court rulings a source kind of their own', () => {
    // SAFLII items are not generic RSS; the worker picks an adapter by this.
    expect(SOURCE_TYPE.SAFLII).toBe('saflii');
    expect(Object.values(SOURCE_TYPE)).toContain('rss');
  });
});

describe('topics', () => {
  it('offers an "all" filter that is not an item topic', () => {
    expect(TOPIC.ALL).toBe('all');
    // `all` is a filter value; no item is ever stored with it.
    expect(Object.values(ITEM_TOPIC)).not.toContain('all');
  });

  it('lists every item topic exactly once, in display order', () => {
    expect(ITEM_TOPICS).toEqual(['court', 'crime', 'politics', 'world']);
    expect(new Set(ITEM_TOPICS).size).toBe(ITEM_TOPICS.length);
  });

  it('covers every filter chip with a matching item topic', () => {
    for (const topic of Object.values(TOPIC)) {
      if (topic === TOPIC.ALL) continue;
      expect(Object.values(ITEM_TOPIC)).toContain(topic);
    }
  });
});

describe('pagination bounds', () => {
  it('keeps the default inside the maximum', () => {
    expect(PAGE_SIZE_DEFAULT).toBeGreaterThan(0);
    expect(PAGE_SIZE_DEFAULT).toBeLessThanOrEqual(PAGE_SIZE_MAX);
  });
});

describe('cache settings', () => {
  it('gives every cache namespace a prefix ending in a separator', () => {
    for (const prefix of Object.values(CACHE_PREFIX)) {
      expect(prefix.endsWith(':')).toBe(true);
    }
  });

  it('uses distinct prefixes so the worker can invalidate one namespace', () => {
    const prefixes = Object.values(CACHE_PREFIX);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it('keeps every TTL positive', () => {
    for (const ttl of Object.values(CACHE_TTL)) {
      expect(ttl).toBeGreaterThan(0);
    }
  });
});

describe('release metadata', () => {
  it('advertises a latest version a client can parse', () => {
    expect(APP_RELEASE.latestVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(APP_RELEASE.minimumVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('describes the advertised latest version in the notes', () => {
    // Otherwise the app offers an update it cannot describe.
    expect(RELEASE_NOTES[0]?.version).toBe(APP_RELEASE.latestVersion);
  });

  it('gives every release at least one highlight', () => {
    for (const note of RELEASE_NOTES) {
      expect(note.highlights.length).toBeGreaterThan(0);
      expect(note.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
