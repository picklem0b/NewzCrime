/** Preloading: warm every topic, skip fresh pages, never block on failure. */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { feed, load, setItem, getItem, removeItem } = vi.hoisted(() => ({
	feed: vi.fn(),
	load: vi.fn(),
	setItem: vi.fn(),
	getItem: vi.fn(),
	removeItem: vi.fn()
}));

vi.mock('../contentService', () => ({
	contentService: { feed }
}));

vi.mock('@/stores/sources.store', () => ({
	useSourcesStore: { getState: () => ({ load }) }
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
	default: { setItem, getItem, removeItem }
}));

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
	topic: null
};

beforeEach(() => {
	vi.resetModules();
	feed.mockReset().mockResolvedValue({ items: [item], nextCursor: null });
	load.mockReset().mockResolvedValue(undefined);
	setItem.mockReset().mockResolvedValue(undefined);
	getItem.mockReset().mockResolvedValue(null);
	removeItem.mockReset().mockResolvedValue(undefined);
});

describe('preloadAppContent', () => {
	it('fetches the primary topic first and then every other topic', async () => {
		const { preloadAppContent } = await import('../preload');

		await preloadAppContent('politics');

		const topics = feed.mock.calls.map(([params]) => params.topic);
		expect(topics[0]).toBe('politics');
		expect(new Set(topics)).toEqual(
			new Set(['all', 'court', 'crime', 'politics', 'world'])
		);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('writes the fetched page into the feed cache', async () => {
		const { preloadAppContent } = await import('../preload');
		const { readMemoryFeed } = await import('../feedCache');

		await preloadAppContent('all');

		expect(readMemoryFeed('all:stories')?.items).toHaveLength(1);
	});

	it('does not spend a second request on a fresh page', async () => {
		const { preloadAppContent } = await import('../preload');

		await preloadAppContent('all');
		const callsAfterFirstRun = feed.mock.calls.length;

		await preloadAppContent('all');

		expect(feed.mock.calls.length).toBe(callsAfterFirstRun);
	});

	it('resolves even when every request fails', async () => {
		feed.mockRejectedValue(new Error('offline'));
		load.mockRejectedValue(new Error('offline'));

		const { preloadAppContent } = await import('../preload');

		await expect(preloadAppContent('all')).resolves.toBeUndefined();
	});
});
