/**
 * Watch helpers.
 *
 * The API stores a channel's category and province, but a national channel can
 * still publish a story about a specific province. The keyword map bridges
 * that gap, so a reader in Limpopo sees a SABC video about Polokwane even
 * though SABC is a national source.
 */

import type { ContentItem, Province, Source } from '@newzcrime/shared';
import { PROVINCE_LABEL } from '@newzcrime/shared';

import type { ProvinceFilter, WatchCategory } from '@/types';

export interface WatchRail {
  id: WatchCategory;
  label: string;
  blurb: string;
}

export const WATCH_RAILS: readonly WatchRail[] = [
  {
    id: 'for_you',
    label: 'For you',
    blurb: 'The newest from every channel'
  },
  {
    id: 'local',
    label: 'Local',
    blurb: 'Your province, your city, your streets'
  },
  {
    id: 'true_crime',
    label: 'True crime',
    blurb: 'Cases, investigations and the people behind them'
  },
  {
    id: 'courts',
    label: 'Courts',
    blurb: 'Live proceedings, judgments and commissions'
  },
  {
    id: 'news',
    label: 'News',
    blurb: 'Breaking stories and live briefings'
  }
];

const PROVINCE_KEYWORDS: Record<Province, readonly string[]> = {
  gauteng: [
    'gauteng',
    'johannesburg',
    'joburg',
    'soweto',
    'pretoria',
    'tshwane',
    'ekurhuleni',
    'germiston',
    'boksburg',
    'benoni',
    'midrand',
    'sandton',
    'centurion',
    'alexandra',
    'vanderbijlpark',
    'vereeniging',
    'kempton park',
    'roodepoort',
    'randburg',
    'springs',
    'brakpan',
    'bronkhorstspruit'
  ],
  western_cape: [
    'western cape',
    'cape town',
    'kaapstad',
    'stellenbosch',
    'paarl',
    'george',
    'knysna',
    'mossel bay',
    'hermanus',
    'worcester',
    'oudtshoorn',
    'saldanha',
    'khayelitsha',
    'gugulethu',
    'mitchells plain',
    'delft',
    'durbanville'
  ],
  kwazulu_natal: [
    'kwazulu-natal',
    'kwazulu natal',
    'kzn',
    'durban',
    'ethekwini',
    'pietermaritzburg',
    'umhlanga',
    'richards bay',
    'newcastle',
    'ladysmith',
    'port shepstone',
    'empangeni',
    'ulundi',
    'ballito'
  ],
  eastern_cape: [
    'eastern cape',
    'gqeberha',
    'port elizabeth',
    'east london',
    'makhanda',
    'grahamstown',
    'bhisho',
    'king william',
    'queenstown',
    'mthatha',
    'umtata',
    'kariega',
    'despatch'
  ],
  free_state: [
    'free state',
    'bloemfontein',
    'botshabelo',
    'welkom',
    'sasolburg',
    'bethlehem',
    'kroonstad',
    'parys',
    'phuthaditjhaba',
    'harrismith'
  ],
  limpopo: [
    'limpopo',
    'polokwane',
    'pietersburg',
    'thohoyandou',
    'tzaneen',
    'mokopane',
    'potgietersrus',
    'lephalale',
    'ellisras',
    'musina',
    'phalaborwa',
    'bela-bela'
  ],
  mpumalanga: [
    'mpumalanga',
    'mbombela',
    'nelspruit',
    'emalahleni',
    'witbank',
    'middelburg',
    'ermelo',
    'secunda',
    'standerton',
    'barberton',
    'komatipoort',
    'sabie'
  ],
  north_west: [
    'north west',
    'north-west',
    'mahikeng',
    'mafikeng',
    'rustenburg',
    'potchefstroom',
    'klerksdorp',
    'brits',
    'lichtenburg',
    'zeerust',
    'vryburg'
  ],
  northern_cape: [
    'northern cape',
    'kimberley',
    'upington',
    'springbok',
    'kuruman',
    'de aar',
    'colesberg',
    'postmasburg',
    'kathu',
    'calvinia'
  ]
};

/** A video and the channel that published it, so rails need no second lookup. */
export interface VideoEntry {
  item: ContentItem;
  source: Source | undefined;
}

const haystack = (item: ContentItem): string =>
  `${item.title} ${item.excerpt ?? ''}`.toLowerCase();

/** The province an item is explicitly about, if any. */
export function provinceForItem(item: ContentItem): Province | null {
  const text = haystack(item);
  for (const [province, keywords] of Object.entries(PROVINCE_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return province as Province;
    }
  }
  return null;
}

export function matchesProvince(
  item: ContentItem,
  source: Source | undefined,
  province: ProvinceFilter
): boolean {
  if (province === 'all') return true;
  if (source?.province === province) return true;
  return provinceForItem(item) === province;
}

/** The category rail an entry belongs in, from its channel metadata. */
export function railForEntry(entry: VideoEntry): WatchCategory {
  const category = entry.source?.category;
  if (category === 'true_crime' || category === 'courts' || category === 'news') {
    return category;
  }
  return 'for_you';
}

export function filterVideos(
  entries: readonly VideoEntry[],
  category: WatchCategory,
  province: ProvinceFilter
): VideoEntry[] {
  if (category === 'for_you') return [...entries];
  if (category === 'local') {
    return entries.filter(
      (entry) =>
        matchesProvince(entry.item, entry.source, province) &&
        (province !== 'all' ||
          entry.source?.category === 'local' ||
          entry.source?.province != null ||
          provinceForItem(entry.item) !== null)
    );
  }
  return entries.filter((entry) => entry.source?.category === category);
}

/**
 * Put the reader's province first without hiding the national picture.
 *
 * Sorting only by province would make the feed repetitive; a stable order with
 * local entries promoted keeps both. Within each group the API's newest-first
 * order is preserved because `sort` is stable in modern JS runtimes.
 */
export function localFirst(
  entries: readonly VideoEntry[],
  province: ProvinceFilter,
  enabled: boolean
): VideoEntry[] {
  if (!enabled || province === 'all') return [...entries];

  return [...entries].sort((left, right) => {
    const leftLocal = matchesProvince(left.item, left.source, province) ? 1 : 0;
    const rightLocal = matchesProvince(right.item, right.source, province) ? 1 : 0;
    return rightLocal - leftLocal;
  });
}

/** A title that says LIVE, or the red-dot marker most newsrooms use. */
export function isLiveVideo(item: ContentItem): boolean {
  return item.title.includes('🔴') || /\blive\b/i.test(item.title);
}

/** `18432` reads as `18.4K views`, which is what a video card can hold. */
export function formatViewCount(count: number | null | undefined): string | null {
  if (count === null || count === undefined || !Number.isFinite(count)) {
    return null;
  }
  if (count < 1_000) return `${count} views`;
  if (count < 1_000_000) {
    const value = count / 1_000;
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)}K views`;
  }
  const value = count / 1_000_000;
  return `${value.toFixed(1)}M views`;
}

export function provinceLabel(province: ProvinceFilter): string {
  return province === 'all' ? 'South Africa' : PROVINCE_LABEL[province];
}

/** Description paragraphs, with blank runs collapsed so cards are not gappy. */
export function descriptionParagraphs(excerpt: string | null): string[] {
  if (!excerpt) return [];
  return excerpt
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
