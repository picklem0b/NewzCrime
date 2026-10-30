/**
 * YouTube channel adapter.
 *
 * A channel's public Atom feed is the only ingestion surface YouTube offers
 * without an API key. It carries the video id, thumbnail, description and
 * counts, which the generic RSS adapter would throw away. Each channel is a
 * `sources` row of type `youtube`, so the scheduler, retries and per-source
 * failure handling are shared with every other feed.
 *
 * The feed lists the latest 15 uploads. That is enough for a "what's new"
 * shelf; the app never pretends it is a complete archive.
 */

import { XMLParser } from 'fast-xml-parser';

import type { NormalizedItem, Source } from '@newzcrime/shared';

import type { RssAdapterOptions, SourceAdapter } from '../types';
import { fetchXml } from '../utils/fetchXml';
import { decodeEntities } from '../utils/text';

type XmlNode = Record<string, unknown>;

const DEFAULT_MAX_ITEMS = 25;

/** YouTube serves Atom, not RSS. */
const FEED_ACCEPT = 'application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: {
    enabled: true,
    maxTotalExpansions: 100_000,
    maxExpandedLength: 2_000_000,
  },
  isArray: (name) =>
    ['entry', 'link', 'media:thumbnail', 'media:content'].includes(name),
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

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const parseCount = (value: string | null): number | null => {
  if (!value) return null;
  const count = Number.parseInt(value, 10);
  return Number.isFinite(count) && count >= 0 ? count : null;
};

/**
 * The video id in an entry.
 *
 * `yt:videoId` is authoritative. The fallback parses `yt:video:<id>` from the
 * entry id, because a feed transformed by a cache sometimes drops the media
 * namespace but keeps the id.
 */
function pickVideoId(entry: XmlNode): string | null {
  const direct = readText(entry['yt:videoId']);
  if (direct && /^[A-Za-z0-9_-]{11}$/.test(direct)) return direct;

  const id = readText(entry.id);
  const match = id ? /^yt:video:([A-Za-z0-9_-]{11})$/.exec(id) : null;
  return match?.[1] ?? null;
}

function pickThumbnail(entry: XmlNode, videoId: string): string | null {
  const group = asNode(entry['media:group']);

  for (const node of asArray(group?.['media:thumbnail'])) {
    const url = readAttr(node, 'url');
    if (url && isHttpUrl(url)) return url;
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Keep paragraph breaks in a video description.
 *
 * The article excerpt helper intentionally collapses whitespace, but a YouTube
 * description uses line breaks for chapters, links and credits. Flattening it
 * to one paragraph is what makes a video page look empty.
 */
function toVideoDescription(value: string | null): string | null {
  if (!value) return null;

  const text = decodeEntities(value)
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (text.length === 0) return null;
  if (text.length <= 1600) return text;

  const clipped = text.slice(0, 1600);
  const lastBreak = Math.max(clipped.lastIndexOf('\n'), clipped.lastIndexOf(' '));
  return `${(lastBreak > 1200 ? clipped.slice(0, lastBreak) : clipped).trimEnd()}\u2026`;
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapEntry(entry: XmlNode, channelName: string | null): NormalizedItem | null {
  const videoId = pickVideoId(entry);
  const rawTitle = readText(entry.title);
  if (!videoId || !rawTitle) return null;

  const title = decodeEntities(rawTitle).replace(/\s+/g, ' ').trim();
  if (title.length === 0) return null;

  const group = asNode(entry['media:group']);
  const description = toVideoDescription(
    readText(group?.['media:description'])
  );
  const statistics = asNode(group?.['media:community'])?.['media:statistics'];
  const starRating = asNode(group?.['media:community'])?.['media:starRating'];

  const publishedAt =
    toIso(readText(entry.published)) ??
    toIso(readText(entry.updated)) ??
    new Date().toISOString();

  const authorNode = asNode(entry.author);
  const author = readText(authorNode?.name) ?? channelName;

  return {
    externalId: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    excerpt: description,
    imageUrl: pickThumbnail(entry, videoId),
    audioUrl: null,
    author: author ? decodeEntities(author).trim() : null,
    publishedAt,
    viewCount: parseCount(readAttr(statistics, 'views')),
    likeCount: parseCount(readAttr(starRating, 'count')),
  };
}

export function createYoutubeAdapter(options: RssAdapterOptions): SourceAdapter {
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;

  return {
    type: 'youtube',

    async fetchFeed(source: Source): Promise<NormalizedItem[]> {
      const xml = await fetchXml(source.feedUrl, {
        userAgent: options.userAgent,
        timeoutMs: options.timeoutMs,
        accept: FEED_ACCEPT,
      });
      const parsed = parser.parse(xml) as XmlNode;
      const feed = asNode(parsed.feed);

      if (!feed) {
        throw new Error('no YouTube Atom feed found');
      }

      const channelName = readText(feed.title);
      const entries = asArray(feed.entry);

      if (entries.length === 0) {
        // An empty feed is legitimate for a dormant channel, but a malformed
        // one is not. Treating it as empty would silently hide a broken source.
        throw new Error('YouTube channel feed has no entries');
      }

      const items: NormalizedItem[] = [];
      for (const raw of entries) {
        const entry = asNode(raw);
        if (!entry) continue;
        const item = mapEntry(entry, channelName);
        if (item) items.push(item);
        if (items.length >= maxItems) break;
      }

      return items;
    },
  };
}

export default createYoutubeAdapter;
