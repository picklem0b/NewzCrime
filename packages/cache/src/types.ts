/**
 * Cache contracts.
 *
 * One interface, two backends: Redis when it is reachable, an in-process map
 * otherwise. Callers never branch on which one is active, so the API keeps
 * serving when Redis is down.
 */

export interface CacheConfig {
  /** TCP endpoint, e.g. `redis://127.0.0.1:6379` or `rediss://…` for TLS. */
  url: string;
  /** Prepended to every key, so one Redis instance can host several apps. */
  keyPrefix?: string;
  /** How long to wait for the initial connection before falling back. */
  connectTimeoutMs?: number;
  /** Called when Redis is unavailable and the memory backend takes over. */
  onFallback?: (reason: string) => void;
}

export interface Cache {
  /** Which backend is live. Useful for logs and `/health`. */
  readonly backend: CacheBackend;
  get<TValue>(key: string): Promise<TValue | null>;
  set<TValue>(key: string, value: TValue, ttlSeconds: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  /** Remove every key under a prefix. Used to invalidate feed pages at once. */
  delByPrefix(prefix: string): Promise<void>;
  close(): Promise<void>;
}

export type CacheBackend = 'redis' | 'memory';
