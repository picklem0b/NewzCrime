/** Time formatting for feed rows and the audio player. */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `"3 hours ago"`, `"just now"`, or a date once an item is over a week old. */
export function formatRelativeTime(
  isoDate: string,
  now: number = Date.now()
): string {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return '';

  const elapsed = now - timestamp;

  // A feed with a clock ahead of ours still reads as "just now", not "-2 hours".
  if (elapsed < MINUTE) return 'just now';

  const minutes = Math.floor(elapsed / MINUTE);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(elapsed / HOUR);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(elapsed / DAY);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** `"42:07"` or `"1:02:07"` for a player position or duration. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  const paddedSeconds = String(seconds).padStart(2, '0');
  if (hours === 0) return `${minutes}:${paddedSeconds}`;

  return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
}
