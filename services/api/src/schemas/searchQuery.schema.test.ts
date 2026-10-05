import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import { searchQuerySchema } from './searchQuery.schema';

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
});
