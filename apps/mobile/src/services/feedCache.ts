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

const STORAGE_PREFIX = 'newzcrime.feed.v1:';
const memory = new Map<string, FeedCacheEntry>();

/** Stable key for one feed query. */
export function feedCacheKey(topic: string, includePodcasts: boolean): string {
	return `${topic}:${includePodcasts ? 'podcasts' : 'stories'}`;
}

export function isFresh(entry: FeedCacheEntry, now = Date.now()): boolean {
	return now - entry.savedAt <= FEED_CACHE_TTL_MS;
}

/** Reads a fresh entry from memory, or `null` when there is nothing usable. */
export function readMemoryFeed(
	key: string,
	now = Date.now()
): FeedCacheEntry | null {
	const entry = memory.get(key);
	if (!entry) return null;
	if (!isFresh(entry, now)) {
		memory.delete(key);
		return null;
	}
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
export async function readDiskFeed(key: string): Promise<FeedCacheEntry | null> {
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

		return isFresh(entry) ? entry : null;
	} catch {
		return null;
	}
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
