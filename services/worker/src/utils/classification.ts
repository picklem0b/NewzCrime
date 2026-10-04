/**
 * Topic classification.
 *
 * A keyword heuristic. It is applied at ingest so the feed filter is an indexed
 * column lookup rather than a scan of every title. Classification is advisory:
 * an item that matches nothing keeps a `null` topic and still appears under the
 * `all` filter.
 */

import type { ItemTopic } from '@newzcrime/shared';

/** Checked in order; the first match wins. */
const TOPIC_KEYWORDS: ReadonlyArray<readonly [ItemTopic, readonly string[]]> = [
  [
    'court',
    [
      'court',
      'judgment',
      'judgement',
      'magistrate',
      'tribunal',
      'prosecutor',
      'prosecution',
      'sentenc',
      'guilty',
      'acquittal',
      'bail',
      'appeal',
      'inquest',
      'subpoena',
      'testif',
      'cross-examin',
      'legal',
      'litigation',
      'constitutional',
      'defamation',
    ],
  ],
  [
    'crime',
    [
      'arrest',
      'police',
      'murder',
      'hijack',
      'robber',
      'burglar',
      'kidnap',
      'abduct',
      'rape',
      'assault',
      'stab',
      'shooting',
      'gunmen',
      'gang',
      'cartel',
      'drug',
      'narcotic',
      'fraud',
      'embezzl',
      'poach',
      'smuggl',
      'crime',
      'criminal',
      'suspect',
      'victim',
      'manslaughter',
      'corruption',
    ],
  ],
  [
    'politics',
    [
      'parliament',
      'cabinet',
      'minister',
      'president',
      'election',
      'municipal',
      'councilor',
      'councillor',
      'anc ',
      'eff ',
      'democratic alliance',
      'policy',
      'legislation',
      'bill',
      'premier',
    ],
  ],
  [
    'world',
    [
      'ukraine',
      'gaza',
      'israel',
      'palestin',
      'russia',
      'china',
      'trump',
      'united states',
      'european union',
      'united nations',
      'nigeria',
      'zimbabwe',
      'kenya',
      'mozambique',
      'international',
      'global',
    ],
  ],
];

/** Classify a title and excerpt. Returns `null` when nothing matches. */
export function classifyTopic(
  title: string,
  excerpt: string | null
): ItemTopic | null {
  const haystack = `${title} ${excerpt ?? ''}`.toLowerCase();

  for (const [topic, keywords] of TOPIC_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return topic;
  }

  return null;
}
