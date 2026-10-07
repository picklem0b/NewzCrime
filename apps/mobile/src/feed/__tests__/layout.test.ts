import type { ContentItem, ItemTopic } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import { buildFeedEntries, HIERARCHY_WINDOW } from '.././layout';

const item = (
	id: number,
	topic: ItemTopic | null = null,
	imageUrl: string | null = null
): ContentItem => ({
	id: String(id),
	sourceId: 'src-1',
	type: 'article',
	topic,
	externalId: `ext-${id}`,
	title: `Story ${id}`,
	url: `https://example.co.za/${id}`,
	excerpt: null,
	imageUrl,
	audioUrl: null,
	author: null,
	publishedAt: '2026-10-05T08:00:00.000Z'
});

const ids = (entries: ReturnType<typeof buildFeedEntries>): string[] =>
	entries.flatMap(entry => ('item' in entry ? [entry.item.id] : []));

describe('buildFeedEntries', () => {
	it('returns nothing for an empty feed', () => {
		expect(buildFeedEntries([], 'all')).toEqual([]);
	});

	it('leads with the first story that has an image', () => {
		const entries = buildFeedEntries(
			[item(1), item(2, null, 'https://img/2.jpg'), item(3)],
			'all'
		);

		expect(entries[0]).toMatchObject({ kind: 'lead' });
		expect(
			entries[0] && 'item' in entries[0] ? entries[0].item.id : null
		).toBe('2');
	});

	it('falls back to the newest story when none has an image', () => {
		const entries = buildFeedEntries([item(1), item(2), item(3)], 'all');

		expect(
			entries[0] && 'item' in entries[0] ? entries[0].item.id : null
		).toBe('1');
	});

	it('never shows a story twice', () => {
		const items = Array.from({ length: 30 }, (_unused, index) =>
			item(index + 1, index % 2 === 0 ? 'court' : 'crime')
		);
		const shown = ids(buildFeedEntries(items, 'all'));

		expect(new Set(shown).size).toBe(shown.length);
		expect(shown).toHaveLength(items.length);
	});

	it('adds a section only when a topic has at least two stories', () => {
		const items = [
			item(1),
			item(2),
			item(3),
			item(4),
			item(5),
			item(6, 'court'),
			item(7, 'court'),
			item(8, 'world')
		];
		const labels = buildFeedEntries(items, 'all').flatMap(entry =>
			entry.kind === 'section' ? [entry.label] : []
		);

		expect(labels).toContain('In court');
		expect(labels).not.toContain('World');
		expect(labels).toContain('Latest');
	});

	it('keeps a filtered feed flat', () => {
		const entries = buildFeedEntries(
			[item(1, 'court'), item(2, 'court'), item(3, 'court')],
			'court'
		);

		expect(entries.some(entry => entry.kind === 'section')).toBe(false);
		expect(entries.map(entry => entry.kind)).toEqual([
			'lead',
			'story',
			'story'
		]);
	});

	it('does not reshuffle earlier entries when a later page arrives', () => {
		const first = Array.from(
			{ length: HIERARCHY_WINDOW + 1 },
			(_unused, index) =>
				item(index + 1, index % 3 === 0 ? 'crime' : null)
		);
		const more = [item(100, 'crime'), item(101, 'crime')];

		const before = buildFeedEntries(first, 'all').map(entry => entry.key);
		const after = buildFeedEntries([...first, ...more], 'all').map(
			entry => entry.key
		);

		expect(after.slice(0, before.length)).toEqual(before);
	});
});
