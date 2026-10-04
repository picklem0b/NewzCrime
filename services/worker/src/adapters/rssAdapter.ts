/**
 * RSS adapter — news articles and podcast episodes.
 *
 * Handles RSS 2.0 and Atom with the same normaliser. Adapters do not touch the
 * database: `fetchFeed` takes a `sources` row and returns normalised items, and
 * the job layer owns persistence and de-duplication.
 *
 * Feed variance is expected and tolerated: missing dates fall back to ingest
 * time, missing ids fall back to a hash of the normalised URL, and a missing
 * excerpt is stored as `null`. Only metadata and an excerpt are kept; the
 * article body is never fetched.
 */

import { createHash } from 'node:crypto';

import { XMLParser } from 'fast-xml-parser';

import type { NormalizedItem, Source } from '@newzcrime/shared';

import type { RssAdapterOptions, SourceAdapter } from '../types';
import { firstImageUrl, stripHtml, toExcerpt } from '../utils/text';

type XmlNode = Record<string, unknown>;

const DEFAULT_MAX_ITEMS = 60;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  // Entities stay enabled, but the default 1000-expansion budget is too low:
  // one publisher's feed exceeds it on every request. The bound is raised
  // rather than removed, so a malicious feed still cannot expand unboundedly.
  processEntities: {
    enabled: true,
    maxTotalExpansions: 100_000,
    maxExpandedLength: 2_000_000,
  },
  // Force the repeatable tags into arrays so the reading code has one shape.
  isArray: (name) =>
    [
      'item',
      'entry',
      'link',
      'enclosure',
      'media:content',
      'media:thumbnail',
    ].includes(name),
});

const asArray = (value: unknown): unknown[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const asNode = (value: unknown): XmlNode | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as XmlNode)
    : null;

const readText = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = readText(entry);
      if (text) return text;
    }
    return null;
  }
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const node = asNode(value);
  const text = node?.['#text'];
  if (typeof text === 'string') return text.trim() || null;
  if (typeof text === 'number') return String(text);
  return null;
};

const readAttr = (value: unknown, name: string): string | null => {
  const node = asNode(value);
  const attribute = node?.[`@_${name}`];
  return typeof attribute === 'string' ? attribute.trim() || null : null;
};

const firstText = (node: XmlNode, names: readonly string[]): string | null => {
  for (const name of names) {
    const found = readText(node[name]);
    if (found) return found;
  }
  return null;
};

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

function pickUrl(entry: XmlNode): string | null {
  for (const link of asArray(entry.link)) {
    const href = readAttr(link, 'href');
    if (!href) continue;
    const rel = readAttr(link, 'rel');
    if (!rel || rel === 'alternate') return href;
  }

  const linkText = readText(entry.link);
  if (linkText && isHttpUrl(linkText)) return linkText;

  for (const candidate of [readText(entry.guid), readText(entry.id)]) {
    if (candidate && isHttpUrl(candidate)) return candidate;
  }

  return null;
}

function pickImage(entry: XmlNode, html: string | null): string | null {
  for (const node of asArray(entry['media:content'])) {
    const medium = readAttr(node, 'medium');
    const type = readAttr(node, 'type');
    const isImage = medium === 'image' || (type?.startsWith('image') ?? false);
    if (isImage) {
      const url = readAttr(node, 'url');
      if (url) return url;
    }
  }

  for (const node of asArray(entry['media:thumbnail'])) {
    const url = readAttr(node, 'url');
    if (url) return url;
  }

  for (const node of asArray(entry.enclosure)) {
    const type = readAttr(node, 'type');
    if (type?.startsWith('image')) {
      const url = readAttr(node, 'url');
      if (url) return url;
    }
  }

  const itunes = readAttr(entry['itunes:image'], 'href');
  if (itunes) return itunes;

  return firstImageUrl(html);
}

/** The playable audio enclosure, for podcast episodes. */
function pickAudioUrl(entry: XmlNode): string | null {
  for (const node of asArray(entry.enclosure)) {
    const type = readAttr(node, 'type');
    const url = readAttr(node, 'url');
    if (url && type?.startsWith('audio')) return url;
  }

  for (const link of asArray(entry.link)) {
    const rel = readAttr(link, 'rel');
    const type = readAttr(link, 'type');
    const href = readAttr(link, 'href');
    if (href && rel === 'enclosure' && (type?.startsWith('audio') ?? false)) {
      return href;
    }
  }

  return null;
}

function pickAuthor(entry: XmlNode): string | null {
  const direct = firstText(entry, ['author', 'dc:creator', 'creator']);
  if (direct) return stripHtml(direct);

  const authorNode = asNode(entry.author);
  const name = authorNode ? readText(authorNode.name) : null;
  return name ? stripHtml(name) : null;
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const sha1 = (value: string): string =>
  createHash('sha1').update(value).digest('hex');

/** Drop the fragment and normalise case, so the same link hashes once. */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function mapEntry(entry: XmlNode): NormalizedItem | null {
  const rawTitle = readText(entry.title);
  const url = pickUrl(entry);
  if (!rawTitle || !url) return null;

  const title = stripHtml(rawTitle);
  if (title.length === 0) return null;

  const html = firstText(entry, [
    'content:encoded',
    'content',
    'description',
    'summary',
  ]);
  const publishedAt =
    toIso(
      firstText(entry, ['pubDate', 'published', 'updated', 'dc:date'])
    ) ?? new Date().toISOString();

  const externalId =
    readText(entry.guid) ?? readText(entry.id) ?? sha1(normalizeUrl(url));

  return {
    externalId,
    title,
    url,
    excerpt: toExcerpt(html),
    imageUrl: pickImage(entry, html),
    audioUrl: pickAudioUrl(entry),
    author: pickAuthor(entry),
    publishedAt,
  };
}

async function fetchXml(
  url: string,
  options: RssAdapterOptions
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': options.userAgent,
        accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`responded ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

export function createRssAdapter(options: RssAdapterOptions): SourceAdapter {
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;

  return {
    type: 'rss',

    async fetchFeed(source: Source): Promise<NormalizedItem[]> {
      const xml = await fetchXml(source.feedUrl, options);
      const parsed = parser.parse(xml) as XmlNode;

      const channel = asNode(asNode(parsed.rss)?.channel);
      const feed = asNode(parsed.feed);
      const entries = channel
        ? asArray(channel.item)
        : feed
          ? asArray(feed.entry)
          : [];

      if (entries.length === 0) {
        throw new Error('no RSS channel or Atom feed found');
      }

      const items: NormalizedItem[] = [];
      for (const raw of entries) {
        const entry = asNode(raw);
        if (!entry) continue;
        const item = mapEntry(entry);
        if (item) items.push(item);
        if (items.length >= maxItems) break;
      }

      return items;
    },
  };
}

export default createRssAdapter;
