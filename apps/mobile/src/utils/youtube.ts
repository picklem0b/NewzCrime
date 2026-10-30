/**
 * YouTube URL handling.
 *
 * YouTube channel feeds give every entry a watch URL, but items can also
 * arrive with short, shorts or embed links. The app only needs the 11-character
 * video id for the embedded player.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_URL_PATTERNS = [
  /^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})/,
  /^https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /^https?:\/\/(?:www\.|m\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /^https?:\/\/(?:www\.|m\.)?youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})/,
];

/** The video id in a YouTube URL, or `null` for anything else. */
export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = pattern.exec(url);
    if (match?.[1] && VIDEO_ID.test(match[1])) return match[1];
  }

  return null;
}

/** A canonical watch URL, used when a feed supplies only an id. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
