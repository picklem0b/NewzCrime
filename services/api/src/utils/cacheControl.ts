/**
 * `Cache-Control` for public reads.
 *
 * `stale-while-revalidate` lets a CDN or the device serve the previous page
 * while it refreshes, which is what keeps a free, single-instance API from
 * feeling cold: the first reader after an idle period still gets an instant
 * response, and the refresh happens behind them.
 */
export function publicCache(seconds: number): string {
  const revalidate = Math.max(seconds, seconds * 4);
  return `public, max-age=${seconds}, stale-while-revalidate=${revalidate}`;
}

/** Health and other live probes must never be cached. */
export const NO_STORE = 'no-store, max-age=0';

/**
 * `Cache-Control` for a list endpoint that may come back empty.
 *
 * An empty page is never stored: the reader has just been told there is
 * nothing, and the next ingest may make that false seconds later. Caching the
 * emptiness for minutes is how a working feed looks broken.
 */
export function pageCache(seconds: number, isEmpty: boolean): string {
  return isEmpty ? NO_STORE : publicCache(seconds);
}

/**
 * Drop the conditional-request headers for this response.
 *
 * Express evaluates `If-None-Match` before it looks at `Cache-Control`, and a
 * 304 tells the client to reuse the body it already has. For an empty page that
 * is exactly wrong: the client cached "no stories", the ingester has since
 * filled the database, and the revalidation keeps the empty body. Removing the
 * validators for an empty page forces a fresh 200 with the new contents.
 */
export function skipConditionalGet(req: {
  headers: Record<string, unknown>;
}): void {
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
}
