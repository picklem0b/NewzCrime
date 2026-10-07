/**
 * SAFLII adapter tests.
 *
 * These run against a recorded feed rather than the live one, because SAFLII
 * answers datacentre addresses with a Cloudflare challenge. Everything that
 * matters is pure parsing, so the fixture exercises the real code path.
 */

import { describe, expect, it } from 'vitest';

import {
  courtCodeFromFeedUrl,
  courtNameFromCode,
  parseSafliiFeed,
} from '.././safliiAdapter';
import {
  SAFLII_FEED_WITH_UNDATED_ITEM,
  SAFLII_ZACC_FEED,
} from '.././safliiAdapter.fixture';

const options = { courtName: courtNameFromCode('ZACC') };

describe('courtCodeFromFeedUrl', () => {
  it('reads the court code from a SAFLII feed path', () => {
    expect(
      courtCodeFromFeedUrl(
        'https://www.saflii.org/cgi-bin/rss_feed.cgi?path=za/cases/ZASCA'
      )
    ).toBe('ZASCA');
  });

  it('returns null when there is no path', () => {
    expect(
      courtCodeFromFeedUrl('https://www.saflii.org/cgi-bin/rss_feed.cgi')
    ).toBeNull();
  });

  it('falls back to the raw code for an unmapped court', () => {
    expect(courtNameFromCode('ZAUNKNOWN')).toBe('ZAUNKNOWN');
    expect(courtNameFromCode(null)).toBe('Unreported court');
  });
});

describe('parseSafliiFeed', () => {
  const items = parseSafliiFeed(SAFLII_ZACC_FEED, options);

  it('parses every item in the feed', () => {
    expect(items).toHaveLength(6);
  });

  it('derives the delivery date from the title, as UTC midnight', () => {
    expect(items[0]?.publishedAt).toBe('2017-11-14T00:00:00.000Z');
    expect(items[2]?.publishedAt).toBe('2017-10-31T00:00:00.000Z');
  });

  it('uses the neutral citation as the de-duplication key', () => {
    expect(items[0]?.externalId).toBe('[2017] ZACC 40');
  });

  it('attributes the judgment to the supplying court', () => {
    expect(items[0]?.author).toBe('Constitutional Court');
  });

  it('keeps the full case name as the title', () => {
    expect(items[0]?.title).toContain('Gijima Holdings');
    // The citation and date stay in the title: they are part of how a judgment
    // is cited, and stripping them would lose the case number.
    expect(items[0]?.title).toContain('[2017] ZACC 40');
  });

  it('upgrades plain-HTTP SAFLII links to HTTPS', () => {
    expect(items[0]?.url).toBe(
      'https://www.saflii.org/za/cases/ZACC/2017/40.html'
    );
  });

  it('synthesises an excerpt from the metadata the title carries', () => {
    const excerpt = items[0]?.excerpt ?? '';
    expect(excerpt).toContain('Constitutional Court');
    expect(excerpt).toContain('14 November 2017');
    expect(excerpt).toContain('CCT254/16');
    expect(excerpt).toContain('[2017] ZACC 40');
  });

  it('records no image and no audio, which the feed does not carry', () => {
    expect(items[0]?.imageUrl).toBeNull();
    expect(items[0]?.audioUrl).toBeNull();
  });

  it('drops an item whose date cannot be established', () => {
    const dated = parseSafliiFeed(SAFLII_FEED_WITH_UNDATED_ITEM, options);
    expect(dated).toHaveLength(0);
  });

  it('returns nothing for a body that is not a feed', () => {
    expect(parseSafliiFeed('<html><body>challenge</body></html>', options)).toEqual(
      []
    );
  });

  it('honours the item cap', () => {
    expect(parseSafliiFeed(SAFLII_ZACC_FEED, { ...options, maxItems: 2 })).toHaveLength(2);
  });
});
