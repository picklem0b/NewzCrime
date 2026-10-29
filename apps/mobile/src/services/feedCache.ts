/**
 * Feed cache, memory first and disk second.
 *
 * The memory layer makes returning to Today instant and costs nothing; the disk
 * layer is what lets a cold start show yesterday's stories when the free API
 * instance is asleep. Entries expire so a cached page cannot outlive a few
 * minutes of publishing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContentItem } from '@newzcrime/shared';

export interface FeedCacheEntry {
	items: ContentItem[];
	nextCursor: string | null;
	savedAt: number;
}

/** A cached page is trusted for this long. */
export const FEED_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * How old a page may be when it is used as the first paint.
 *
 * The five-minute window decides whether a cached page is still *current*, not
 * whether it is worth showing. A page from yesterday is a better opening view
 * than a skeleton, and the network request that follows replaces it as soon as
 * the server answers.
 */
export const FEED_STALE_PAINT_MS = 24 * 60 * 60 * 1000;

const STORAGE_PREFIX = 'newzcrime.feed.v1:';
const memory = new Map<string, FeedCacheEntry>();

/** Stable key for one feed query. */
export function feedCacheKey(topic: string, includePodcasts: boolean): string {
	return `${topic}:${includePodcasts ? 'podcasts' : 'stories'}`;
}

export function isFresh(entry: FeedCacheEntry, now = Date.now()): boolean {
	return now - entry.savedAt <= FEED_CACHE_TTL_MS;
}

/**
 * Reads an entry from memory, or `null` when there is nothing usable.
 *
 * The default age limit is the freshness window, which is what a background
 * refresh should use. A first paint passes `FEED_STALE_PAINT_MS` so an older
 * page can still be shown while the request runs.
 */
export function readMemoryFeed(
	key: string,
	now = Date.now(),
	maxAgeMs = FEED_CACHE_TTL_MS
): FeedCacheEntry | null {
	const entry = memory.get(key);
	if (!entry) return null;
	// Do not evict here: one caller may ask for a fresh page while the next
	// asks for a stale first paint, and the entry is bounded by the fixed set
	// of topic keys anyway.
	if (now - entry.savedAt > maxAgeMs) return null;
	return entry;
}

/** Stores a page in memory and schedules a disk write. */
export function writeFeed(
	key: string,
	items: ContentItem[],
	nextCursor: string | null
): void {
	const entry: FeedCacheEntry = { items, nextCursor, savedAt: Date.now() };
	memory.set(key, entry);

	void AsyncStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry)).catch(
		() => undefined
	);
}

/** Reads a page from disk, checked rather than trusted. */
export async function readDiskFeed(
	key: string,
	maxAgeMs = FEED_CACHE_TTL_MS
): Promise<FeedCacheEntry | null> {
	try {
		const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX}${key}`);
		if (!raw) return null;

		const parsed = JSON.parse(raw) as Partial<FeedCacheEntry>;
		if (!Array.isArray(parsed.items) || typeof parsed.savedAt !== 'number') {
			return null;
		}

		const entry: FeedCacheEntry = {
			items: parsed.items as ContentItem[],
			nextCursor:
				typeof parsed.nextCursor === 'string' ? parsed.nextCursor : null,
			savedAt: parsed.savedAt
		};

		return Date.now() - entry.savedAt <= maxAgeMs ? entry : null;
	} catch {
		return null;
	}
}

/**
 * Drops one page from both layers.
 *
 * Used when the server reports an empty feed. Keeping the old page would let a
 * cold start show yesterday's stories for a query the server has just said is
 * empty, and writing the empty page would make it stick.
 */
export function clearFeed(key: string): void {
	memory.delete(key);
	void AsyncStorage.removeItem(`${STORAGE_PREFIX}${key}`).catch(
		() => undefined
	);
}

/**
 * Moves the last page from disk into memory before the first render.
 *
 * `readMemoryFeed` is synchronous, so the only way Today can paint cached
 * stories on a cold start is for the disk read to finish first. The boot route
 * awaits this; the stored timestamp is kept, so the background request still
 * knows the page is old.
 */
export async function primeFeedFromDisk(
	key: string,
	maxAgeMs = FEED_STALE_PAINT_MS
): Promise<boolean> {
	const entry = await readDiskFeed(key, maxAgeMs);
	if (!entry) return false;

	memory.set(key, entry);
	return true;
}

/** Drops both layers; used by "clear cached data". */
export async function clearFeedCache(): Promise<void> {
	memory.clear();

	try {
		const keys = await AsyncStorage.getAllKeys();
		const target = keys.filter(key => key.startsWith(STORAGE_PREFIX));
		if (target.length > 0) await AsyncStorage.multiRemove(target);
	} catch {
		// Nothing cached.
	}
}
