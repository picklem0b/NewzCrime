/** Relative-time and duration formatting, as the feed rows and player show it. */

import { describe, expect, it } from 'vitest';

import { formatDuration, formatRelativeTime } from './time';

const NOW = Date.parse('2023-06-15T12:00:00.000Z');
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe('formatRelativeTime', () => {
  it('reads a fresh item as "just now"', () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe('just now');
    expect(formatRelativeTime(ago(59), NOW)).toBe('just now');
  });

  it('counts minutes, singular and plural', () => {
    expect(formatRelativeTime(ago(60), NOW)).toBe('1 minute ago');
    expect(formatRelativeTime(ago(60 * 59), NOW)).toBe('59 minutes ago');
  });

  it('counts hours', () => {
    expect(formatRelativeTime(ago(3600), NOW)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(3600 * 23), NOW)).toBe('23 hours ago');
  });

  it('counts days up to a week', () => {
    expect(formatRelativeTime(ago(86400), NOW)).toBe('1 day ago');
    expect(formatRelativeTime(ago(86400 * 6), NOW)).toBe('6 days ago');
  });

  it('falls back to a calendar date once an item is a week old', () => {
    const result = formatRelativeTime(ago(86400 * 30), NOW);
    // Locale-dependent formatting; assert it is no longer relative.
    expect(result).not.toMatch(/ago|just now/);
    expect(result).toContain('2023');
  });

  it('treats a clock running ahead as "just now", never negative', () => {
    expect(formatRelativeTime(ago(-3600), NOW)).toBe('just now');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
  });
});

describe('formatDuration', () => {
  it('pads seconds and omits an empty hour', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(7)).toBe('0:07');
    expect(formatDuration(67)).toBe('1:07');
  });

  it('adds hours once the track is over an hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3727)).toBe('1:02:07');
  });

  it('floors fractional seconds', () => {
    expect(formatDuration(59.9)).toBe('0:59');
  });

  it('degrades to "0:00" for nonsense input', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatDuration(-5)).toBe('0:00');
  });
});
