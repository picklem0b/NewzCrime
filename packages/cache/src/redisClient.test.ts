import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCache } from './redisClient';
import type { Cache } from './types';

/**
 * An address nothing listens on, so the connection fails immediately and the
 * memory backend takes over. The point of these tests is the fallback path: an
 * unreachable Redis must never stop the API from starting.
 */
const UNREACHABLE = 'redis://127.0.0.1:1';

const openMemoryCache = async (): Promise<Cache> =>
  createCache({ url: UNREACHABLE, connectTimeoutMs: 300, keyPrefix: 'test:' });

afterEach(() => {
  vi.useRealTimers();
});

describe('createCache', () => {
  it('falls back to the memory backend when Redis cannot be reached', async () => {
    const cache = await openMemoryCache();
    expect(cache.backend).toBe('memory');
    await cache.close();
  });

  it('reports why it fell back', async () => {
    const onFallback = vi.fn();
    const cache = await createCache({
      url: UNREACHABLE,
      connectTimeoutMs: 300,
      onFallback,
    });

    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(typeof onFallback.mock.calls[0]?.[0]).toBe('string');
    await cache.close();
  });
});

describe('memory backend', () => {
  it('round-trips a value', async () => {
    const cache = await openMemoryCache();

    await cache.set('feed:all', { items: [1, 2] }, 60);
    await expect(cache.get('feed:all')).resolves.toEqual({ items: [1, 2] });

    await cache.close();
  });

  it('returns null for a key that was never set', async () => {
    const cache = await openMemoryCache();
    await expect(cache.get('missing')).resolves.toBeNull();
    await cache.close();
  });

  it('expires an entry once its ttl has passed', async () => {
    vi.useFakeTimers();
    const cache = await openMemoryCache();

    await cache.set('short', 'value', 10);
    await expect(cache.get('short')).resolves.toBe('value');

    vi.advanceTimersByTime(10_001);
    await expect(cache.get('short')).resolves.toBeNull();

    await cache.close();
  });

  it('keeps an entry that is still inside its ttl', async () => {
    vi.useFakeTimers();
    const cache = await openMemoryCache();

    await cache.set('long', 'value', 60);
    vi.advanceTimersByTime(59_000);
    await expect(cache.get('long')).resolves.toBe('value');

    await cache.close();
  });

  it('deletes named keys', async () => {
    const cache = await openMemoryCache();

    await cache.set('a', 1, 60);
    await cache.set('b', 2, 60);
    await cache.del('a');

    await expect(cache.get('a')).resolves.toBeNull();
    await expect(cache.get('b')).resolves.toBe(2);

    await cache.close();
  });

  it('namespaces every key with the prefix, so deletes can match it', async () => {
    // Regression: the memory backend used to store unprefixed keys while
    // `delByPrefix` matched on `${prefix}${rawPrefix}`, so invalidation silently
    // did nothing whenever Redis was down and feed pages went stale.
    const cache = await openMemoryCache();

    await cache.set('feed:all', 'stale', 60);
    await cache.delByPrefix('feed:');

    await expect(cache.get('feed:all')).resolves.toBeNull();
    await cache.close();
  });

  it('deletes every key under a prefix, and nothing else', async () => {
    const cache = await openMemoryCache();

    await cache.set('feed:first', 1, 60);
    await cache.set('feed:second', 2, 60);
    await cache.set('item:1', 3, 60);

    await cache.delByPrefix('feed:');

    await expect(cache.get('feed:first')).resolves.toBeNull();
    await expect(cache.get('feed:second')).resolves.toBeNull();
    // A prefix delete must not take the whole cache with it.
    await expect(cache.get('item:1')).resolves.toBe(3);

    await cache.close();
  });

  it('empties itself on close', async () => {
    const cache = await openMemoryCache();

    await cache.set('key', 'value', 60);
    await cache.close();

    await expect(cache.get('key')).resolves.toBeNull();
  });
});
