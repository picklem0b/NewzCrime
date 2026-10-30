/**
 * Remote image helpers.
 *
 * YouTube publishes every thumbnail at several sizes under predictable names.
 * The feed gives us `hqdefault`; a reader on a tight data budget can take
 * `mqdefault` instead without changing any stored item.
 */

import type { ThumbnailQuality } from '@/types';

const YOUTUBE_THUMB = /^https?:\/\/i\d?\.ytimg\.com\/vi\/([^/]+)\/[a-z]+default\.jpg/i;

/** The same image at the requested size, when the host supports sizes. */
export function thumbnailUri(
  uri: string,
  quality: ThumbnailQuality
): string {
  if (quality === 'standard') return uri;

  const match = YOUTUBE_THUMB.exec(uri);
  return match?.[1]
    ? `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`
    : uri;
}
