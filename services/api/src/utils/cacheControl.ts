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
