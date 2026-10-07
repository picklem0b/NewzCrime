import type { ItemTopic, Topic } from '@newzcrime/shared';

import type { Option } from '@/types';

export const feedTopics: readonly Option<Topic>[] = [
	{ id: 'all', label: 'Top' },
	{ id: 'court', label: 'Court' },
	{ id: 'crime', label: 'Crime' },
	{ id: 'politics', label: 'Politics' },
	{ id: 'world', label: 'World' }
];

export const topicLabels: Record<ItemTopic, string> = {
	court: 'Court',
	crime: 'Crime',
	politics: 'Politics',
	world: 'World'
};

export const sectionLabels: Record<ItemTopic, string> = {
	court: 'In court',
	crime: 'Crime',
	politics: 'Politics',
	world: 'World'
};

export const sectionOrder: readonly ItemTopic[] = [
	'court',
	'crime',
	'politics',
	'world'
];
