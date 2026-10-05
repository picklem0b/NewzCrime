/**
 * Settings and feed constants.
 *
 * Each option list must cover its union completely: a missing entry is an
 * option a reader can never select, and a picker that silently cannot express
 * a valid value.
 */

import { ITEM_TOPICS } from '@newzcrime/shared';
import { describe, expect, it } from 'vitest';

import { feedTopics } from '@/feed/constants';
import {
  colourModes,
  defaultSettings,
  startTabs,
  textSizes,
} from '@/settings/constants';

describe('feedTopics', () => {
  it('offers every item topic, and `all` first', () => {
    const ids = feedTopics.map((topic) => topic.id);

    expect(ids[0]).toBe('all');
    for (const topic of ITEM_TOPICS) {
      expect(ids).toContain(topic);
    }
  });

  it('gives every chip a label', () => {
    for (const topic of feedTopics) {
      expect(topic.label.length).toBeGreaterThan(0);
    }
  });
});

describe('settings constants', () => {
  it('covers every colour mode, light and dark included', () => {
    expect(colourModes.map((mode) => mode.id)).toEqual([
      'system',
      'light',
      'dark',
    ]);
  });

  it('covers every text size', () => {
    expect(textSizes.map((size) => size.id)).toEqual([
      'small',
      'default',
      'large',
    ]);
  });

  it('covers every start tab the app has', () => {
    expect(startTabs.map((tab) => tab.id)).toEqual([
      'home',
      'discover',
      'saved',
    ]);
  });

  it('defaults every setting to a value on its own option list', () => {
    expect(colourModes.map((mode) => mode.id)).toContain(
      defaultSettings.colourMode
    );
    expect(textSizes.map((size) => size.id)).toContain(defaultSettings.textSize);
    expect(startTabs.map((tab) => tab.id)).toContain(defaultSettings.startTab);
  });

  it('has a boolean default for every switch', () => {
    expect(typeof defaultSettings.breakingNews).toBe('boolean');
    expect(typeof defaultSettings.podcastNotifications).toBe('boolean');
    expect(typeof defaultSettings.downloadOnWifi).toBe('boolean');
    expect(typeof defaultSettings.autoplayNext).toBe('boolean');
  });
});
