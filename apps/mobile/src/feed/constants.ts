/** Display options for the feed's topic filter. Values, no components. */

import type { Topic } from '@newzcrime/shared';

import type { Option } from '@/types';

/** Order the chips appear in on Home. */
export const feedTopics: ReadonlyArray<Option<Topic>> = [
  { id: 'all', label: 'Top' },
  { id: 'court', label: 'Court' },
  { id: 'crime', label: 'Crime' },
  { id: 'politics', label: 'Politics' },
  { id: 'world', label: 'World' },
];

/** Label for one topic, for headings and the source detail screen. */
export function topicLabel(topic: Topic): string {
  return feedTopics.find((option) => option.id === topic)?.label ?? 'Top';
}
