/**
 * Full article text for a single item.
 *
 * Feeds carry only a short excerpt, and publishers very reasonably do not put
 * their whole story in it. The first time a reader opens an item, the API
 * fetches the publisher page, extracts the readable article with Readability
 * and caches the paragraphs in `content_items.body`. Every later reader gets
 * the stored text, so a popular story costs the publisher one request, not one
 * per reader.
 *
 * Extraction is best-effort. A paywall, a login wall, a bot block or a page
 * that is not HTML yields `unavailable`, the app falls back to the excerpt and
 * the publisher link, and `body_fetched_at` records the attempt so a page that
 * will never work is not hammered on every open. Failed attempts are retried
 * after a week, because paywalls and blocks do change.
 */

import { getItemBody, getItemById, saveItemBody } from '@newzcrime/db';
import { Readability } from '@mozilla/readability';
import type { ItemContent } from '@newzcrime/shared';
import { parseHTML } from 'linkedom';

import type { ApiDependencies } from '../types';

/** Give up on a slow publisher rather than holding the API request open. */
const FETCH_TIMEOUT_MS = 9_000;

/** Do not download more than this much HTML. News pages are well below it. */
const MAX_HTML_BYTES = 5 * 1024 * 1024;

/** A page shorter than this is a teaser or an error page, not the story. */
const MIN_BODY_LENGTH = 400;

/** Keep response bodies in the low hundreds of kilobytes, even for long reads. */
const MAX_BODY_LENGTH = 120_000;

/** A failed extraction is retried after this long. */
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Parallel publisher fetches. Bounds memory and outbound connections. */
const MAX_CONCURRENT_EXTRACTIONS = 4;

/**
 * A bot-friendly, identifiable user agent. Some publishers block unknown
 * clients outright; introducing ourselves with a contact URL keeps the traffic
 * attributable, which is the polite thing to do when fetching their pages.
 */
const USER_AGENT =
  'Mozilla/5.0 (compatible; NewzCrime/1.0; +https://github.com/picklem0b/NewzCrime)';

/** One extraction per item at a time, even if several readers open it at once. */
const inFlight = new Map<string, Promise<ItemContent>>();

let activeExtractions = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeExtractions < MAX_CONCURRENT_EXTRACTIONS) {
    activeExtractions += 1;
    return;
  }

  await new Promise<void>((resolve) => waiters.push(resolve));
  activeExtractions += 1;
}

function releaseSlot(): void {
  activeExtractions -= 1;
  const next = waiters.shift();
  if (next) next();
}

/**
 * Turn Readability's HTML fragment into plain paragraphs.
 *
 * The app renders plain text, not HTML: a WebView for article bodies would be
 * slower, harder to style with the reader's settings and a much larger attack
 * surface. Paragraph boundaries are preserved as blank lines, which is what
 * the app splits on.
 */
function toParagraphs(html: string): string {
  const { document } = parseHTML(`<article>${html}</article>`);
  const blocks = Array.from(
    document.querySelectorAll(
      'p, h2, h3, h4, blockquote, pre, li'
    ) as ArrayLike<{ textContent: string | null }>
  );

  const paragraphs: string[] = [];
  let length = 0;

  for (const block of blocks) {
    const text = (block.textContent ?? '').replace(/\s+/g, ' ').trim();
    // Readability sometimes nests a `p` inside an `li`; skip the duplicate.
    if (text.length < 2 || text === paragraphs[paragraphs.length - 1]) continue;

    paragraphs.push(text);
    length += text.length;
    if (length >= MAX_BODY_LENGTH) break;
  }

  const joined = paragraphs.join('\n\n');
  if (joined.length > 0) return joined.slice(0, MAX_BODY_LENGTH);

  // Very old or table-based pages may have no paragraph tags at all.
  return (document.querySelector('article')?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BODY_LENGTH);
}

async function fetchArticleBody(url: string): Promise<string | null> {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': USER_AGENT,
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) return null;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('xml')) {
    return null;
  }

  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_HTML_BYTES) return null;

  const html = await response.text();
  if (html.length === 0 || html.length > MAX_HTML_BYTES) return null;

  const { document } = parseHTML(html);
  const reader = new Readability(document as never);
  const article = reader.parse();

  const body = article?.content ? toParagraphs(article.content) : '';
  if (!body || body.length < MIN_BODY_LENGTH) return null;

  return body;
}

function unavailable(itemId: string, sourceUrl: string, fetchedAt: Date): ItemContent {
  return {
    itemId,
    status: 'unavailable',
    body: null,
    fetchedAt: fetchedAt.toISOString(),
    sourceUrl,
  };
}

async function extract(
  deps: ApiDependencies,
  itemId: string,
  sourceUrl: string
): Promise<ItemContent> {
  try {
    const body = await fetchArticleBody(sourceUrl);

    // Store the attempt either way. Writing `null` is what stops a paywalled
    // page from being fetched again on the next open.
    await saveItemBody(deps.db, itemId, body);

    if (!body) {
      deps.logger.debug(
        { itemId, sourceUrl },
        'full text unavailable; using the publisher link'
      );
      return unavailable(itemId, sourceUrl, new Date());
    }

    return {
      itemId,
      status: 'ready',
      body,
      fetchedAt: new Date().toISOString(),
      sourceUrl,
    };
  } catch (error) {
    // A network error is still an attempt. Record it, then let the reader keep
    // reading the excerpt instead of showing them a failed screen.
    await saveItemBody(deps.db, itemId, null).catch(() => undefined);
    deps.logger.warn(
      { err: error, itemId, sourceUrl },
      'full-text extraction failed'
    );
    return unavailable(itemId, sourceUrl, new Date());
  }
}

/**
 * Return an item's full text, extracting it on first use.
 *
 * `null` means the item does not exist. An existing item that cannot be read
 * in full returns `unavailable`, which is a normal state, not an error.
 */
export async function getItemContent(
  deps: ApiDependencies,
  itemId: string
): Promise<ItemContent | null> {
  const item = await getItemById(deps.db, itemId);
  if (!item) return null;

  const stored = await getItemBody(deps.db, itemId);
  if (!stored) return null;

  if (stored.body) {
    return {
      itemId,
      status: 'ready',
      body: stored.body,
      fetchedAt: (stored.fetchedAt ?? new Date()).toISOString(),
      sourceUrl: item.url,
    };
  }

  const attemptedAt = stored.fetchedAt;
  const retryable =
    attemptedAt === null ||
    Date.now() - attemptedAt.getTime() > RETRY_AFTER_MS;

  if (!retryable) {
    return unavailable(itemId, item.url, attemptedAt);
  }

  // Podcasts and videos are media, not articles; there is no page body to
  // extract, and fetching the watch page would return player chrome.
  if (item.type === 'podcast_episode' || item.type === 'video') {
    return unavailable(itemId, item.url, attemptedAt ?? new Date());
  }

  if (!/^https?:\/\//i.test(item.url)) {
    return unavailable(itemId, item.url, attemptedAt ?? new Date());
  }

  const running = inFlight.get(itemId);
  if (running) return running;

  const promise = (async () => {
    await acquireSlot();
    try {
      return await extract(deps, itemId, item.url);
    } finally {
      releaseSlot();
      inFlight.delete(itemId);
    }
  })();

  inFlight.set(itemId, promise);
  return promise;
}
