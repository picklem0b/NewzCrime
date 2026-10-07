/**
 * Saved store tests.
 *
 * A bookmark must survive a restart and stay playable offline, so these cover
 * persistence and the cap as well as the in-memory toggle.
 */

import type { ContentItem } from '@newzcrime/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getItem, setItem, removeItem } = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem, setItem, removeItem },
}));

const { useSavedStore } = await import('.././saved.store');

const STORAGE_KEY = 'newzcrime.saved.v1';

const item = (id: string): ContentItem => ({
  id,
  sourceId: 'src-1',
  type: 'article',
  topic: 'crime',
  externalId: `ext-${id}`,
  title: `Story ${id}`,
  url: `https://example.co.za/${id}`,
  excerpt: null,
  imageUrl: null,
  audioUrl: null,
  author: null,
  publishedAt: '2023-06-15T12:00:00.000Z',
});

beforeEach(() => {
  useSavedStore.setState({ items: [], isHydrated: false });
  getItem.mockReset();
  setItem.mockReset();
  removeItem.mockReset();
  setItem.mockResolvedValue(undefined);
  removeItem.mockResolvedValue(undefined);
});

describe('saved store', () => {
  it('saves an item and reports it as saved', () => {
    const store = useSavedStore.getState();
    expect(store.isSaved('a')).toBe(false);

    store.toggle(item('a'));

    expect(useSavedStore.getState().items).toHaveLength(1);
    expect(useSavedStore.getState().isSaved('a')).toBe(true);
  });

  it('unsaves an item when toggled a second time', () => {
    useSavedStore.getState().toggle(item('a'));
    useSavedStore.getState().toggle(item('a'));

    expect(useSavedStore.getState().items).toHaveLength(0);
    expect(useSavedStore.getState().isSaved('a')).toBe(false);
  });

  it('puts the newest save first', () => {
    useSavedStore.getState().toggle(item('a'));
    useSavedStore.getState().toggle(item('b'));

    expect(useSavedStore.getState().items.map((entry) => entry.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('keeps a full snapshot, so an episode stays playable offline', () => {
    const episode = {
      ...item('ep'),
      type: 'podcast_episode' as const,
      audioUrl: 'https://example.co.za/ep.mp3',
    };

    useSavedStore.getState().toggle(episode);

    const [saved] = useSavedStore.getState().items;
    expect(saved?.audioUrl).toBe('https://example.co.za/ep.mp3');
    expect(saved?.title).toBe('Story ep');
  });

  it('writes the list to storage on every change', () => {
    useSavedStore.getState().toggle(item('a'));

    expect(setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(useSavedStore.getState().items)
    );
  });

  it('caps the list so it cannot grow without limit', () => {
    for (let index = 0; index < 520; index += 1) {
      useSavedStore.getState().toggle(item(`id-${index}`));
    }

    const { items } = useSavedStore.getState();
    expect(items).toHaveLength(500);
    // The newest are kept; the oldest are dropped.
    expect(items[0]?.id).toBe('id-519');
  });

  it('clears the list and its storage entry', () => {
    useSavedStore.getState().toggle(item('a'));
    useSavedStore.getState().clear();

    expect(useSavedStore.getState().items).toHaveLength(0);
    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('hydrates from storage', async () => {
    getItem.mockResolvedValue(JSON.stringify([item('a'), item('b')]));

    await useSavedStore.getState().hydrate();

    expect(useSavedStore.getState().items.map((entry) => entry.id)).toEqual([
      'a',
      'b',
    ]);
    expect(useSavedStore.getState().isHydrated).toBe(true);
  });

  it('starts empty when storage is corrupt, rather than crashing', async () => {
    getItem.mockResolvedValue('{not json');

    await useSavedStore.getState().hydrate();

    expect(useSavedStore.getState().items).toEqual([]);
    expect(useSavedStore.getState().isHydrated).toBe(true);
  });

  it('ignores a stored value that is not a list', async () => {
    getItem.mockResolvedValue(JSON.stringify({ nope: true }));

    await useSavedStore.getState().hydrate();

    expect(useSavedStore.getState().items).toEqual([]);
  });

  it('still hydrates when storage itself rejects', async () => {
    getItem.mockRejectedValue(new Error('storage unavailable'));

    await useSavedStore.getState().hydrate();

    expect(useSavedStore.getState().isHydrated).toBe(true);
  });
});
