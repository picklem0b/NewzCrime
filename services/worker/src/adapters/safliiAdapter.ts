/**
 * SAFLII adapter — reported court judgments.
 *
 * SAFLII (the Southern African Legal Information Institute) publishes one RSS
 * feed per court:
 *
 *   https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/<COURT>
 *
 * Its items are unusually thin. Each carries only a title and a link — there is
 * no `pubDate`, no `description` and no `guid`. Everything the domain needs is
 * encoded in the title itself:
 *
 *   Fono and Another v Port St Johns Municipality (1271/2022) [2024] ZASCA 161 (22 November 2024)
 *   └────────────────── case name ──────────────────┘ └ case no. ┘ └ citation ┘ └ delivered ┘
 *
 * So this adapter derives the publication date, the neutral citation, the case
 * number and a plain-text excerpt from the title, and the supplying court from
 * the feed path. The judgment body is never fetched: only metadata is stored.
 *
 * A single court feed is small (roughly the last 15–30 decisions), which is why
 * an undated item is skipped rather than dated with the ingest time — dating it
 * "now" would drop a years-old judgment on top of the live news feed.
 */

import { createHash } from 'node:crypto';

import { XMLParser } from 'fast-xml-parser';

import type { NormalizedItem, Source } from '@newzcrime/shared';

import type { SafliiAdapterOptions, SourceAdapter } from '../types';
import { fetchXml } from '../utils/fetchXml';
import { stripHtml } from '../utils/text';

/** Items taken from one court feed. Court feeds never approach this. */
const DEFAULT_MAX_ITEMS = 40;

const FEED_ACCEPT =
  'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8';

/** Only the repeating `item` tag needs forcing into an array. */
const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  parseTagValue: false,
  processEntities: { enabled: true, maxTotalExpansions: 100_000 },
  isArray: (name) => name === 'item',
});

/**
 * Court code (the last path segment of the feed URL) to the court's name, as it
 * should read in a byline. Codes come from SAFLII's own neutral citations, so
 * they are stable; an unknown code falls back to the code itself.
 */
const COURT_NAMES: Readonly<Record<string, string>> = {
  ZACC: 'Constitutional Court',
  ZASCA: 'Supreme Court of Appeal',
  ZAGPPHC: 'Gauteng Division, Pretoria',
  ZAGPJHC: 'Gauteng Local Division, Johannesburg',
  ZAWCHC: 'Western Cape Division, Cape Town',
  ZAKZDHC: 'KwaZulu-Natal Local Division, Durban',
  ZAKZPHC: 'KwaZulu-Natal Division, Pietermaritzburg',
  ZAECGHC: 'Eastern Cape Division, Makhanda',
  ZAECBHC: 'Eastern Cape Local Division, Bhisho',
  ZAFSHC: 'Free State Division, Bloemfontein',
  ZANCHC: 'Northern Cape Division, Kimberley',
  ZALMPHC: 'Limpopo Division, Polokwane',
  ZANWHC: 'North West Division, Mahikeng',
  ZALCJHB: 'Labour Court, Johannesburg',
  ZACT: 'Tax Court',
};

const MONTH_INDEX: Readonly<Record<string, number>> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const MONTH_NAMES = Object.keys(MONTH_INDEX);

/** `[2024] ZASCA 161` — the neutral citation every judgment carries. */
const CITATION_PATTERN = /\[(\d{4})\]\s+([A-Za-z]+)\s+(\d+)/;

/** `(22 November 2024)` — the delivery date, always the last parenthetical. */
const DELIVERED_PATTERN = /\((\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\)\s*$/;

/**
 * `(1271/2022)` and `(CCT254/16)` — the court's own case number. The sequence
 * after the slash is two digits on old matters and four on new ones.
 */
const CASE_NUMBER_PATTERN = /\(([^)]*\d+\s*\/\s*\d{2,4}[^)]*)\)/;

/** `/za/cases/ZASCA/2024/161.html` — year and sequence, when a title has no date. */
const URL_CASE_PATTERN = /\/za\/cases\/[^/]+\/(\d{4})\/(\d+)\.html/i;

const MAX_ITEMS_EXCERPT = 400;

const sha1 = (value: string): string =>
  createHash('sha1').update(value).digest('hex');

const asNode = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** `title` and `link` are plain text nodes; only a string can come back. */
function readText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  return null;
}

/** The court code at the end of a feed URL, uppercase, or `null`. */
export function courtCodeFromFeedUrl(feedUrl: string): string | null {
  try {
    const path = new URL(feedUrl).searchParams.get('path');
    if (!path) return null;
    const segment = path.split('/').filter(Boolean).pop();
    return segment ? segment.toUpperCase() : null;
  } catch {
    return null;
  }
}

/** Display name for a court code, falling back to the code itself. */
export function courtNameFromCode(code: string | null): string {
  if (!code) return 'Unreported court';
  return COURT_NAMES[code] ?? code;
}

/**
 * The delivery date, as UTC midnight.
 *
 * The title gives a day but no time, so midnight UTC is the honest value: it
 * orders correctly by day without implying a precision the source lacks.
 */
function parseDeliveredAt(title: string): string | null {
  const match = DELIVERED_PATTERN.exec(title);
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const month = MONTH_INDEX[(monthText ?? '').toLowerCase()];
  if (month === undefined) return null;

  const day = Number.parseInt(dayText ?? '', 10);
  const year = Number.parseInt(yearText ?? '', 10);
  if (!Number.isFinite(day) || !Number.isFinite(year)) return null;

  return new Date(Date.UTC(year, month, day)).toISOString();
}

/** `[2024] ZASCA 161`, verbatim, or `null`. */
function parseCitation(title: string): string | null {
  const match = CITATION_PATTERN.exec(title);
  return match ? match[0].replace(/\s+/g, ' ').trim() : null;
}

/** The court's case number, e.g. `1271/2022`, or `null`. */
function parseCaseNumber(title: string): string | null {
  // The delivered date is also parenthesised; require a number on both sides of
  // the slash so it can never be mistaken for the date.
  const match = CASE_NUMBER_PATTERN.exec(title);
  return match?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
}

/** SAFLII serves plain HTTP links; the same pages are available over HTTPS. */
function toSecureUrl(url: string): string {
  return url.replace(/^http:\/\/(www\.)?saflii\.org/i, 'https://www.saflii.org');
}

/** Drop the fragment and lowercase, so the same judgment hashes once. */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** `22 November 2024`, from an ISO date. Only used in the excerpt. */
function formatDeliveredAt(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const month = MONTH_NAMES[date.getUTCMonth()] ?? '';
  return `${date.getUTCDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getUTCFullYear()}`;
}

/**
 * SAFLII supplies no description, so the excerpt is assembled from what the
 * title does carry: the court, the case number, the date and the citation. It
 * is real information rather than padding, and it gives the search index and
 * the read-aloud feature something to work with.
 */
function buildExcerpt(
  courtName: string,
  deliveredAt: string | null,
  caseNumber: string | null,
  citation: string | null
): string | null {
  const parts = [`Judgment of the ${courtName}`];
  const delivered = deliveredAt ? formatDeliveredAt(deliveredAt) : null;
  if (delivered) parts.push(`delivered ${delivered}`);
  const sentence = `${parts.join(', ')}.`;

  const details: string[] = [];
  if (caseNumber) details.push(`Case number ${caseNumber}`);
  if (citation) details.push(`neutral citation ${citation}`);
  const suffix = details.length > 0 ? ` ${details.join('; ')}.` : '';

  return `${sentence}${suffix}`.slice(0, MAX_ITEMS_EXCERPT);
}

/** The two fields an item is read for; both arrive as raw XML text. */
interface SafliiEntry {
  title?: unknown;
  link?: unknown;
}

function mapEntry(
  entry: SafliiEntry,
  courtName: string
): NormalizedItem | null {
  const rawTitle = readText(entry.title);
  const rawLink = readText(entry.link);
  if (!rawTitle || !rawLink) return null;

  const title = stripHtml(rawTitle);
  if (title.length === 0) return null;

  const url = toSecureUrl(rawLink);
  const citation = parseCitation(title);
  const caseNumber = parseCaseNumber(title);

  // Prefer the title's own date. Failing that, fall back to the judgment's year
  // from the URL, dated to 1 January: the year is known even when the day is
  // not, and it still sorts below genuinely current news. An item with neither
  // is skipped rather than dated with the ingest time.
  let publishedAt = parseDeliveredAt(title);
  if (!publishedAt) {
    const urlMatch = URL_CASE_PATTERN.exec(url);
    if (urlMatch) {
      publishedAt = new Date(Date.UTC(Number(urlMatch[1]), 0, 1)).toISOString();
    }
  }
  if (!publishedAt) return null;

  return {
    // The citation is unique and stable, so it makes the best de-duplication
    // key; the URL hash covers any item that lacks one.
    externalId: citation ?? sha1(normalizeUrl(url)),
    title,
    url,
    excerpt: buildExcerpt(courtName, publishedAt, caseNumber, citation),
    // Court feeds carry no image, no audio and no named author beyond the court.
    imageUrl: null,
    audioUrl: null,
    author: courtName,
    publishedAt,
  };
}

/**
 * Parse a SAFLII feed. Pure, so it can be tested against a recorded feed
 * without network access — which matters, because SAFLII sits behind a
 * Cloudflare challenge that datacentre addresses never get past.
 */
export function parseSafliiFeed(
  xml: string,
  options: { courtName: string; maxItems?: number }
): NormalizedItem[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const channel = asNode(asNode(parsed.rss)?.channel);
  if (!channel) return [];

  const entries = Array.isArray(channel.item) ? channel.item : [];
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;

  const items: NormalizedItem[] = [];
  for (const raw of entries) {
    const entry = asNode(raw) as SafliiEntry | null;
    if (!entry) continue;

    const item = mapEntry(entry, options.courtName);
    if (item) items.push(item);
    if (items.length >= maxItems) break;
  }

  return items;
}

export function createSafliiAdapter(
  options: SafliiAdapterOptions
): SourceAdapter {
  return {
    type: 'saflii',

    async fetchFeed(source: Source): Promise<NormalizedItem[]> {
      const courtName = courtNameFromCode(courtCodeFromFeedUrl(source.feedUrl));

      const xml = await fetchXml(source.feedUrl, {
        userAgent: options.userAgent,
        timeoutMs: options.timeoutMs,
        accept: FEED_ACCEPT,
      });

      const items = parseSafliiFeed(xml, {
        courtName,
        maxItems: options.maxItems ?? DEFAULT_MAX_ITEMS,
      });

      if (items.length === 0) {
        throw new Error(
          `no dated judgments found for ${courtName}; the feed format may have changed`
        );
      }

      return items;
    },
  };
}

export default createSafliiAdapter;
