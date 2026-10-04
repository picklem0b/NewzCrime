/**
 * Cursor codec.
 *
 * A cursor is the sort key of the last row on a page — `published_at` and `id`
 * — encoded so clients treat it as opaque. Keyset pagination is used instead of
 * `OFFSET` because items are inserted continuously and offset pages drift.
 */

import type { Cursor } from './types';

const SEPARATOR = '|';

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(
    `${cursor.publishedAt}${SEPARATOR}${cursor.id}`,
    'utf8'
  ).toString('base64url');
}

/** Returns `null` for anything malformed, so bad input is a first page. */
export function decodeCursor(value: string | undefined): Cursor | null {
  if (!value) return null;

  try {
    const raw = Buffer.from(value, 'base64url').toString('utf8');
    const separator = raw.indexOf(SEPARATOR);
    if (separator === -1) return null;

    const publishedAt = raw.slice(0, separator);
    const id = raw.slice(separator + 1);
    if (!publishedAt || !id) return null;
    if (Number.isNaN(Date.parse(publishedAt))) return null;

    return { publishedAt, id };
  } catch {
    return null;
  }
}
