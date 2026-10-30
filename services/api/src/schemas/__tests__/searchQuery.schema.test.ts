import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import {
  searchQuerySchema,
  sourceSearchQuerySchema,
} from '.././searchQuery.schema';

describe('searchQuerySchema', () => {
  it('accepts a query of two characters, the minimum the app sends', () => {
    expect(searchQuerySchema.parse({ q: 'ab' }).q).toBe('ab');
  });

  it('rejects a single character rather than scanning the whole table', () => {
    expect(() => searchQuerySchema.parse({ q: 'a' })).toThrowError();
  });

  it('trims surrounding whitespace before measuring length', () => {
    expect(searchQuerySchema.parse({ q: '  court  ' }).q).toBe('court');
  });

  it('rejects a query that is only whitespace', () => {
    expect(() => searchQuerySchema.parse({ q: '   ' })).toThrowError();
  });

  it('rejects a missing query', () => {
    expect(() => searchQuerySchema.parse({})).toThrowError();
  });

  it('accepts the maximum length and rejects one character more', () => {
    expect(searchQuerySchema.parse({ q: 'a'.repeat(120) }).q).toHaveLength(120);
    expect(() => searchQuerySchema.parse({ q: 'a'.repeat(121) })).toThrowError();
  });

  it('defaults the limit and bounds it', () => {
    expect(searchQuerySchema.parse({ q: 'court' }).limit).toBe(PAGE_SIZE_DEFAULT);
    expect(() =>
      searchQuerySchema.parse({ q: 'court', limit: String(PAGE_SIZE_MAX + 1) })
    ).toThrowError();
  });

  it('rejects a non-numeric limit instead of passing NaN to the query', () => {
    expect(() => searchQuerySchema.parse({ q: 'court', limit: 'many' })).toThrowError();
  });

  it('defaults to newest and accepts every content type', () => {
    expect(searchQuerySchema.parse({ q: 'court' }).sort).toBe('newest');

    for (const type of ['article', 'court_ruling', 'podcast_episode', 'video']) {
      expect(searchQuerySchema.parse({ q: 'court', type }).type).toBe(type);
    }
  });

  it('accepts a topic, a source and ISO date bounds', () => {
    const parsed = searchQuerySchema.parse({
      q: 'court',
      topic: 'crime',
      sourceId: '11111111-1111-1111-1111-111111111111',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
      sort: 'oldest',
    });

    expect(parsed).toMatchObject({
      topic: 'crime',
      sourceId: '11111111-1111-1111-1111-111111111111',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
      sort: 'oldest',
    });
  });

  it('parses a comma-separated list of followed sources', () => {
    expect(
      searchQuerySchema.parse({
        q: 'court',
        sourceIds:
          '11111111-1111-1111-1111-111111111111, 22222222-2222-2222-2222-222222222222',
      }).sourceIds
    ).toHaveLength(2);
  });

  it('rejects a malformed source id rather than passing it to the query', () => {
    expect(() =>
      searchQuerySchema.parse({ q: 'court', sourceIds: 'not-a-uuid' })
    ).toThrowError();
  });

  it('rejects malformed dates and an unknown sort', () => {
    expect(() => searchQuerySchema.parse({ q: 'court', from: 'yesterday' })).toThrowError();
    expect(() => searchQuerySchema.parse({ q: 'court', sort: 'popular' })).toThrowError();
  });
});

describe('sourceSearchQuerySchema', () => {
  it('accepts a short name query and bounds the result count', () => {
    expect(sourceSearchQuerySchema.parse({ q: ' News24 ' }).q).toBe('News24');
    expect(() => sourceSearchQuerySchema.parse({ q: 'news', limit: '51' })).toThrowError();
  });

  it('rejects a one-letter directory scan', () => {
    expect(() => sourceSearchQuerySchema.parse({ q: 'n' })).toThrowError();
  });
});
