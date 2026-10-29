/** Feed cache: keys, expiry and the memory layer. */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { setItem, getItem, getAllKeys, multiRemove, removeItem } = vi.hoisted(
	() => ({
		setItem: vi.fn(),
		getItem: vi.fn(),
		getAllKeys: vi.fn(),
		multiRemove: vi.fn(),
		removeItem: vi.fn()
	})
);

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { setItem, getItem, getAllKeys, multiRemove, removeItem }
}));

const {
	FEED_CACHE_TTL_MS,
	FEED_STALE_PAINT_MS,
	clearFeed,
	clearFeedCache,
	feedCacheKey,
	isFresh,
	primeFeedFromDisk,
	readDiskFeed,
	readMemoryFeed,
	writeFeed
} = await import('../feedCache');

const item = {
	id: 'item-1',
	sourceId: 'source-1',
	type: 'article',
	title: 'A story',
	url: 'https://example.com/story',
	excerpt: null,
	author: null,
	imageUrl: null,
	audioUrl: null,
	publishedAt: '2026-10-23T08:00:00.000Z',
	topics: []
} as never;

beforeEach(() => {
	setItem.mockReset().mockResolvedValue(undefined);
	getItem.mockReset();
	getAllKeys.mockReset().mockResolvedValue([]);
	multiRemove.mockReset();
	removeItem.mockReset().mockResolvedValue(undefined);
});

describe('feed cache keys', () => {
	it('separates topics and the podcast switch', () => {
		expect(feedCacheKey('all', false)).toBe('all:stories');
		expect(feedCacheKey('all', true)).toBe('all:podcasts');
		expect(feedCacheKey('court', false)).toBe('court:stories');
	});
});

describe('freshness', () => {
	it('accepts an entry inside the window', () => {
		expect(
			isFresh({ items: [], nextCursor: null, savedAt: 1000 }, 1000 + 1)
		).toBe(true);
	});

	it('rejects an entry past it', () => {
		expect(
			isFresh(
				{ items: [], nextCursor: null, savedAt: 0 },
				FEED_CACHE_TTL_MS + 1
			)
		).toBe(false);
	});
});

describe('memory layer', () => {
	it('returns what was written', () => {
		writeFeed('test:memory', [item], 'cursor-1');

		const cached = readMemoryFeed('test:memory');
		expect(cached?.items).toHaveLength(1);
		expect(cached?.nextCursor).toBe('cursor-1');
	});

	it('ignores an expired entry', () => {
		writeFeed('test:expired', [item], null);

		expect(readMemoryFeed('test:expired', Date.now() + FEED_CACHE_TTL_MS + 1)).toBeNull();
	});

	it('returns null for an unknown key', () => {
		expect(readMemoryFeed('test:missing')).toBeNull();
	});

	it('can be read past the freshness window for a stale first paint', () => {
		writeFeed('test:stale-paint', [item], null);
		const later = Date.now() + FEED_CACHE_TTL_MS + 1;

		expect(readMemoryFeed('test:stale-paint', later)).toBeNull();
		expect(
			readMemoryFeed('test:stale-paint', later, FEED_STALE_PAINT_MS)
		).not.toBeNull();
	});
});

describe('disk layer', () => {
	it('reads a valid entry', async () => {
		getItem.mockResolvedValue(
			JSON.stringify({ items: [item], nextCursor: null, savedAt: Date.now() })
		);

		const cached = await readDiskFeed('test:disk');
		expect(cached?.items).toHaveLength(1);
	});

	it('rejects malformed storage', async () => {
		getItem.mockResolvedValue(JSON.stringify({ items: 'nope', savedAt: 0 }));
		expect(await readDiskFeed('test:disk')).toBeNull();
	});

	it('rejects an expired entry', async () => {
		getItem.mockResolvedValue(
			JSON.stringify({ items: [item], nextCursor: null, savedAt: 0 })
		);
		expect(await readDiskFeed('test:disk')).toBeNull();
	});

	it('accepts an expired entry when a stale first paint asks for it', async () => {
		getItem.mockResolvedValue(
			JSON.stringify({
				items: [item],
				nextCursor: null,
				savedAt: Date.now() - FEED_CACHE_TTL_MS - 1
			})
		);

		expect(await readDiskFeed('test:disk', FEED_STALE_PAINT_MS)).not.toBeNull();
	});
});

describe('clearing one page', () => {
	it('drops it from memory and from disk', () => {
		writeFeed('test:clear', [item], null);
		expect(readMemoryFeed('test:clear')).not.toBeNull();

		clearFeed('test:clear');

		expect(readMemoryFeed('test:clear')).toBeNull();
		expect(removeItem).toHaveBeenCalledWith('newzcrime.feed.v1:test:clear');
	});
});

describe('priming before the first paint', () => {
	it('moves a stored page into memory', async () => {
		getItem.mockResolvedValue(
			JSON.stringify({
				items: [item],
				nextCursor: 'cursor-2',
				savedAt: Date.now()
			})
		);

		expect(await primeFeedFromDisk('test:prime')).toBe(true);

		const primed = readMemoryFeed('test:prime');
		expect(primed?.items).toHaveLength(1);
		expect(primed?.nextCursor).toBe('cursor-2');
	});

	it('reports when there is nothing to prime', async () => {
		getItem.mockResolvedValue(null);
		expect(await primeFeedFromDisk('test:prime-empty')).toBe(false);
	});
});

describe('clearing', () => {
	it('removes only its own keys', async () => {
		getAllKeys.mockResolvedValue([
			'newzcrime.feed.v1:all:stories',
			'newzcrime.settings.v1'
		]);

		await clearFeedCache();

		expect(multiRemove).toHaveBeenCalledWith(['newzcrime.feed.v1:all:stories']);
	});
});
