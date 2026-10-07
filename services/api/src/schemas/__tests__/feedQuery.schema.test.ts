import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import { feedQuerySchema, toFeedQuery, toItemTopic } from '.././feedQuery.schema';

describe('feedQuerySchema', () => {
  it('defaults to every topic at the default page size', () => {
    const parsed = feedQuerySchema.parse({});

    expect(parsed.topic).toBe('all');
    expect(parsed.limit).toBe(PAGE_SIZE_DEFAULT);
    expect(parsed.cursor).toBeUndefined();
    expect(parsed.sourceId).toBeUndefined();
  });

  it('coerces the limit from the string the query string always gives', () => {
    expect(feedQuerySchema.parse({ limit: '5' }).limit).toBe(5);
  });

  it('accepts every topic the client can ask for', () => {
    for (const topic of ['all', 'court', 'crime', 'politics', 'world']) {
      expect(feedQuerySchema.parse({ topic }).topic).toBe(topic);
    }
  });

  it('rejects a topic that is not offered', () => {
    expect(() => feedQuerySchema.parse({ topic: 'sport' })).toThrowError();
  });

  it('rejects a limit above the maximum instead of clamping it', () => {
    expect(() => feedQuerySchema.parse({ limit: String(PAGE_SIZE_MAX + 1) })).toThrowError();
  });

  it('accepts exactly the maximum', () => {
    expect(feedQuerySchema.parse({ limit: String(PAGE_SIZE_MAX) }).limit).toBe(
      PAGE_SIZE_MAX
    );
  });

  it('rejects a fractional or zero limit', () => {
    expect(() => feedQuerySchema.parse({ limit: '1.5' })).toThrowError();
    expect(() => feedQuerySchema.parse({ limit: '0' })).toThrowError();
  });

  it('rejects a cursor that is only whitespace', () => {
    expect(() => feedQuerySchema.parse({ cursor: '' })).toThrowError();
  });

  it('rejects a sourceId that is not a uuid, so it never reaches the query', () => {
    expect(() => feedQuerySchema.parse({ sourceId: 'not-a-uuid' })).toThrowError();
  });

  it('accepts includePodcasts in every spelling the app might send', () => {
    for (const value of ['1', 'true']) {
      expect(feedQuerySchema.parse({ includePodcasts: value }).includePodcasts).toBe(
        true
      );
    }
    for (const value of ['0', 'false']) {
      expect(feedQuerySchema.parse({ includePodcasts: value }).includePodcasts).toBe(
        false
      );
    }
  });

  it('rejects an includePodcasts value that is neither flag', () => {
    expect(() => feedQuerySchema.parse({ includePodcasts: 'yes' })).toThrowError();
  });
});

describe('toFeedQuery', () => {
  it('resolves the optional podcast flag to false rather than undefined', () => {
    expect(toFeedQuery(feedQuerySchema.parse({})).includePodcasts).toBe(false);
  });

  it('passes a supplied cursor through unchanged', () => {
    const parsed = feedQuerySchema.parse({ cursor: 'abc', limit: '3' });

    expect(toFeedQuery(parsed)).toMatchObject({ cursor: 'abc', limit: 3 });
  });
});

describe('toItemTopic', () => {
  it('maps the all filter to no topic filter', () => {
    // Items are never stored with `all`, so filtering on it would match nothing.
    expect(toItemTopic('all')).toBeUndefined();
  });

  it('passes a real topic through', () => {
    expect(toItemTopic('court')).toBe('court');
    expect(toItemTopic('crime')).toBe('crime');
  });
});
