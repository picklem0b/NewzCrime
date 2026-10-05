/**
 * Cache client.
 *
 * Tries Redis over TCP first; if the connection does not come up within
 * `connectTimeoutMs`, it degrades to an in-process map so the API still starts.
 * A runtime Redis failure is handled per operation and does not take the
 * process down.
 *
 * Values are JSON-encoded, so only serialisable data belongs in the cache.
 */

import Redis from 'ioredis';

import type { Cache, CacheBackend, CacheConfig } from './types';

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

const DEFAULT_PREFIX = 'newzcrime:';
const DEFAULT_CONNECT_TIMEOUT_MS = 2_000;

/**
 * Map-backed cache used when Redis is unreachable.
 *
 * Keys carry the same prefix as the Redis backend. The prefix must be applied
 * here too: `delByPrefix` matches on the stored key, so a backend that stored
 * unprefixed keys would silently fail to invalidate, and stale feed pages would
 * outlive their TTL whenever Redis is down.
 */
function createMemoryCache(prefix: string): Cache {
  const store = new Map<string, MemoryEntry>();
  const keyed = (key: string) => `${prefix}${key}`;

  const readLive = (key: string): MemoryEntry | null => {
    const entry = store.get(keyed(key));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      store.delete(keyed(key));
      return null;
    }
    return entry;
  };

  return {
    backend: 'memory',

    async get<TValue>(key: string): Promise<TValue | null> {
      return (readLive(key)?.value as TValue | undefined) ?? null;
    },

    async set<TValue>(key: string, value: TValue, ttlSeconds: number) {
      store.set(keyed(key), {
        value,
        expiresAt: Date.now() + ttlSeconds * 1_000,
      });
    },

    async del(...keys: string[]) {
      for (const key of keys) store.delete(keyed(key));
    },

    async delByPrefix(rawPrefix: string) {
      const match = `${prefix}${rawPrefix}`;
      for (const key of [...store.keys()]) {
        if (key.startsWith(match)) store.delete(key);
      }
    },

    async close() {
      store.clear();
    },
  };
}

/** Redis-backed cache with a prefix applied to every key. */
function createRedisCache(redis: Redis, prefix: string): Cache {
  const keyed = (key: string) => `${prefix}${key}`;

  return {
    backend: 'redis',

    async get<TValue>(key: string): Promise<TValue | null> {
      const raw = await redis.get(keyed(key));
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as TValue;
      } catch {
        // A corrupt entry is treated as a miss rather than an error.
        await redis.del(keyed(key));
        return null;
      }
    },

    async set<TValue>(key: string, value: TValue, ttlSeconds: number) {
      await redis.set(keyed(key), JSON.stringify(value), 'EX', ttlSeconds);
    },

    async del(...keys: string[]) {
      if (keys.length === 0) return;
      await redis.del(...keys.map(keyed));
    },

    async delByPrefix(rawPrefix: string) {
      const pattern = `${prefix}${rawPrefix}*`;
      let cursor = '0';
      do {
        const [next, found] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          200
        );
        cursor = next;
        if (found.length > 0) await redis.del(...found);
      } while (cursor !== '0');
    },

    async close() {
      await redis.quit();
    },
  };
}

/**
 * Build a cache. Resolves to the memory backend when Redis cannot be reached,
 * so a missing Redis is a degraded cache, never a failed startup.
 */
export async function createCache(config: CacheConfig): Promise<Cache> {
  const prefix = config.keyPrefix ?? DEFAULT_PREFIX;
  const redis = new Redis(config.url, {
    connectTimeout: config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
    // Without this ioredis retries forever and never lets us fall back.
    retryStrategy: () => null,
  });

  // ioredis emits `error` events; without a listener Node treats them as fatal.
  let connectionError: string | null = null;
  redis.on('error', (error: Error) => {
    connectionError = error.message;
  });

  try {
    await redis.connect();
    await redis.ping();
    return createRedisCache(redis, prefix);
  } catch (error) {
    const reason =
      connectionError ?? (error instanceof Error ? error.message : String(error));
    redis.disconnect();
    config.onFallback?.(reason);
    return createMemoryCache(prefix);
  }
}

export type { Cache, CacheBackend, CacheConfig };
