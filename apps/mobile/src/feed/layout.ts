import type { ContentItem, ItemTopic, Topic } from '@newzcrime/shared';

import { sectionLabels, sectionOrder } from '@/feed/constants';
import type { FeedEntry } from '@/types';

export const TOP_STORY_COUNT = 3;
export const SECTION_ITEM_LIMIT = 3;
export const SECTION_MIN_ITEMS = 2;
export const HIERARCHY_WINDOW = 20;
const LEAD_CANDIDATES = 5;

const pickLead = (items: ContentItem[]): ContentItem | undefined => {
	const candidates = items.slice(0, LEAD_CANDIDATES);
	return candidates.find(item => item.imageUrl) ?? items[0];
};

export function buildFeedEntries(
	items: ContentItem[],
	topic: Topic
): FeedEntry[] {
	const lead = pickLead(items);
	if (!lead) return [];

	const rest = items.filter(item => item.id !== lead.id);
	const entries: FeedEntry[] = [
		{ kind: 'lead', key: `lead:${lead.id}`, item: lead }
	];

	if (topic !== 'all') {
		for (const item of rest) {
			entries.push({ kind: 'story', key: `story:${item.id}`, item });
		}
		return entries;
	}

	const windowItems = rest.slice(0, HIERARCHY_WINDOW);
	const tail = rest.slice(HIERARCHY_WINDOW);
	const top = windowItems.slice(0, TOP_STORY_COUNT);
	const remaining = windowItems.slice(TOP_STORY_COUNT);

	if (top.length > 0) {
		entries.push({
			kind: 'section',
			key: 'section:top',
			label: 'Top stories'
		});
		for (const item of top) {
			entries.push({ kind: 'story', key: `story:${item.id}`, item });
		}
	}

	const used = new Set<string>();

	for (const sectionTopic of sectionOrder) {
		const group = remaining.filter(
			item => item.topic === (sectionTopic as ItemTopic)
		);
		if (group.length < SECTION_MIN_ITEMS) continue;

		entries.push({
			kind: 'section',
			key: `section:${sectionTopic}`,
			label: sectionLabels[sectionTopic]
		});
		for (const item of group.slice(0, SECTION_ITEM_LIMIT)) {
			used.add(item.id);
			entries.push({ kind: 'story', key: `story:${item.id}`, item });
		}
	}

	const latest = [...remaining.filter(item => !used.has(item.id)), ...tail];

	if (latest.length > 0) {
		entries.push({
			kind: 'section',
			key: 'section:latest',
			label: 'Latest'
		});
		for (const item of latest) {
			entries.push({ kind: 'compact', key: `compact:${item.id}`, item });
		}
	}

	return entries;
}
