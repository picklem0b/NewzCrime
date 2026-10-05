import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from './cursor';

describe('encodeCursor', () => {
  it('produces a URL-safe token with no padding', () => {
    const token = encodeCursor({
      publishedAt: '2026-01-02T03:04:05.000Z',
      id: '3f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8',
    });

    expect(token).not.toMatch(/[+/=]/);
    expect(decodeCursor(token)).toEqual({
      publishedAt: '2026-01-02T03:04:05.000Z',
      id: '3f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8',
    });
  });

  it('round-trips the sort key unchanged', () => {
    const cursor = { publishedAt: '2025-12-31T23:59:59.999Z', id: 'abc' };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it('differs when either half of the key differs', () => {
    const first = encodeCursor({ publishedAt: '2026-01-01T00:00:00.000Z', id: 'a' });
    const second = encodeCursor({ publishedAt: '2026-01-01T00:00:00.000Z', id: 'b' });
    const third = encodeCursor({ publishedAt: '2026-01-02T00:00:00.000Z', id: 'a' });

    expect(first).not.toBe(second);
    expect(first).not.toBe(third);
  });
});

describe('decodeCursor', () => {
  it('treats a missing cursor as the first page', () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });

  it('returns null for input that is not base64 at all', () => {
    expect(decodeCursor('!!!not-a-cursor!!!')).toBeNull();
  });

  it('returns null when the separator is absent', () => {
    const token = Buffer.from('2026-01-01T00:00:00.000Z', 'utf8').toString(
      'base64url'
    );
    expect(decodeCursor(token)).toBeNull();
  });

  it('returns null when the timestamp is not a date', () => {
    const token = Buffer.from('not-a-date|abc', 'utf8').toString('base64url');
    expect(decodeCursor(token)).toBeNull();
  });

  it('returns null when the id is empty', () => {
    const token = Buffer.from('2026-01-01T00:00:00.000Z|', 'utf8').toString(
      'base64url'
    );
    expect(decodeCursor(token)).toBeNull();
  });

  it('returns null when the timestamp is empty', () => {
    const token = Buffer.from('|abc', 'utf8').toString('base64url');
    expect(decodeCursor(token)).toBeNull();
  });

  it('keeps an id that itself contains the separator', () => {
    // Ids are uuids today, but the split must not silently truncate.
    const token = Buffer.from('2026-01-01T00:00:00.000Z|a|b', 'utf8').toString(
      'base64url'
    );

    expect(decodeCursor(token)).toEqual({
      publishedAt: '2026-01-01T00:00:00.000Z',
      id: 'a|b',
    });
  });
});
