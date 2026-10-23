/**
 * Read-through cache for API responses.
 *
 * Everything written here lives under one key prefix. `clearCache` therefore
 * removes only cached responses — never settings, bookmarks or the reading
 * history, which share the same AsyncStorage store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_PREFIX = 'newzcrime.cache.v1:';

export interface CachePayload<T> {
	data: T;
	timestamp: number;
	ttl?: number;
}

const namespaced = (key: string): string => `${CACHE_PREFIX}${key}`;

export async function setCache<T>(
	key: string,
	data: T,
	ttlMs?: number
): Promise<void> {
	try {
		const payload: CachePayload<T> = { data, timestamp: Date.now(), ttl: ttlMs };
		await AsyncStorage.setItem(namespaced(key), JSON.stringify(payload));
	} catch {
		// A full disk is not worth failing a render over; the network still works.
	}
}

export async function getCache<T>(key: string): Promise<T | null> {
	try {
		const raw = await AsyncStorage.getItem(namespaced(key));
		if (!raw) return null;

		const payload = JSON.parse(raw) as CachePayload<T>;
		if (payload.ttl && Date.now() - payload.timestamp > payload.ttl) {
			await AsyncStorage.removeItem(namespaced(key));
			return null;
		}

		return payload.data;
	} catch {
		return null;
	}
}

export async function removeCache(key: string): Promise<void> {
	try {
		await AsyncStorage.removeItem(namespaced(key));
	} catch {
		// Ignored: nothing to remove.
	}
}

/** Drops cached responses, all of them or those under a second prefix. */
export async function clearCache(prefix = ''): Promise<void> {
	try {
		const keys = await AsyncStorage.getAllKeys();
		const target = `${CACHE_PREFIX}${prefix}`;
		const toRemove = keys.filter(key => key.startsWith(target));
		if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
	} catch {
		// Ignored: nothing to remove.
	}
}

/** Number of cached responses, used by the Data section. */
export async function cacheEntryCount(): Promise<number> {
	try {
		const keys = await AsyncStorage.getAllKeys();
		return keys.filter(key => key.startsWith(CACHE_PREFIX)).length;
	} catch {
		return 0;
	}
}
