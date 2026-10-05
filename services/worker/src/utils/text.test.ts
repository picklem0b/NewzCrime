/**
 * Text helper tests.
 *
 * These pin the boundary between a publisher's HTML and what we store: plain
 * text, a bounded length, and no leaked markup.
 */

import { describe, expect, it } from 'vitest';

import {
  decodeEntities,
  firstImageUrl,
  stripHtml,
  toExcerpt,
} from './text';

describe('decodeEntities', () => {
  it('resolves named entities', () => {
    expect(decodeEntities('Crime &amp; courts')).toBe('Crime & courts');
    expect(decodeEntities('&lsquo;quote&rsquo;')).toBe('\u2018quote\u2019');
  });

  it('resolves decimal and hex character references', () => {
    expect(decodeEntities('caf&#233;')).toBe('caf\u00e9');
    expect(decodeEntities('caf&#xE9;')).toBe('caf\u00e9');
  });

  it('leaves an unknown entity untouched rather than dropping it', () => {
    expect(decodeEntities('&notreal;')).toBe('&notreal;');
  });

  it('handles an entity name case-insensitively', () => {
    expect(decodeEntities('A &AMP; B')).toBe('A & B');
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world');
  });

  it('drops script and style bodies, not just their tags', () => {
    const html =
      '<style>.a{color:red}</style><script>alert(1)</script><p>Real text</p>';
    expect(stripHtml(html)).toBe('Real text');
  });

  it('treats block boundaries as spaces so words do not run together', () => {
    expect(stripHtml('<p>One</p><p>Two</p>')).toBe('One Two');
    expect(stripHtml('One<br/>Two')).toBe('One Two');
  });

  it('decodes entities that survive tag removal', () => {
    expect(stripHtml('<p>Crime &amp; courts</p>')).toBe('Crime & courts');
  });

  it('returns an empty string for markup with no text', () => {
    expect(stripHtml('<div></div>')).toBe('');
  });
});

describe('toExcerpt', () => {
  it('returns null for null or empty input', () => {
    expect(toExcerpt(null)).toBeNull();
    expect(toExcerpt('')).toBeNull();
    expect(toExcerpt('<p></p>')).toBeNull();
  });

  it('returns the whole text when it fits', () => {
    expect(toExcerpt('<p>Short and sharp.</p>')).toBe('Short and sharp.');
  });

  it('cuts at a word boundary and marks the ellipsis', () => {
    const text = `${'word '.repeat(40)}end`;
    const excerpt = toExcerpt(text, 20) ?? '';
    expect(excerpt.endsWith('\u2026')).toBe(true);
    // 21 characters: at most 20 kept, plus the ellipsis.
    expect(excerpt.length).toBeLessThanOrEqual(21);
    // Never cuts mid-word.
    expect(excerpt).not.toMatch(/\bwor\u2026$/);
  });

  it('honours a custom maximum length', () => {
    const excerpt = toExcerpt('abcdefghij', 5) ?? '';
    expect(excerpt.startsWith('abcde')).toBe(true);
  });
});

describe('firstImageUrl', () => {
  it('extracts a double-quoted src', () => {
    expect(firstImageUrl('<img src="https://x.test/a.jpg" alt="" />')).toBe(
      'https://x.test/a.jpg'
    );
  });

  it('extracts a single-quoted src', () => {
    expect(firstImageUrl("<img class='lead' src='https://x.test/b.png'>")).toBe(
      'https://x.test/b.png'
    );
  });

  it('returns null when there is no image', () => {
    expect(firstImageUrl('<p>No picture</p>')).toBeNull();
    expect(firstImageUrl(null)).toBeNull();
  });
});
