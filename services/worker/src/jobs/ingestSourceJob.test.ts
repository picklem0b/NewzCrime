/**
 * Ingest job tests.
 *
 * The database is mocked so the job's own decisions are what is under test:
 * which topic an item gets, when the cache is invalidated, and above all that
 * one broken feed is recorded rather than thrown. Partial success is the whole
 * point of running one source per job.
 */

import type { Cache } from '@newzcrime/cache';
import type { Database } from '@newzcrime/db';
import { getSourceById, upsertItems } from '@newzcrime/db';
import type { NormalizedItem, Source } from '@newzcrime/shared';
import type { Logger } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SourceAdapter } from '../types';

vi.mock('@newzcrime/db', () => ({
  getSourceById: vi.fn(),
  upsertItems: vi.fn(),
}));

const { createIngestSourceJob, ingestSource } = await import(
  './ingestSourceJob'
);

type IngestSourceDeps = Parameters<typeof ingestSource>[0];

const mockGetSourceById = vi.mocked(getSourceById);
const mockUpsertItems = vi.mocked(upsertItems);

const source = (overrides: Partial<Source> = {}): Source => ({
  id: '11111111-1111-1111-1111-111111111111',
  name: 'SAPS Newsroom',
  type: 'rss',
  contentType: 'article',
  feedUrl: 'https://example.co.za/feed',
  siteUrl: null,
  logoUrl: null,
  description: null,
  createdAt: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

const item = (overrides: Partial<NormalizedItem> = {}): NormalizedItem => ({
  externalId: 'ext-1',
  title: 'Man arrested in Soweto',
  url: 'https://example.co.za/a',
  excerpt: null,
  imageUrl: null,
  audioUrl: null,
  author: null,
  publishedAt: '2023-01-02T13:04:05.000Z',
  ...overrides,
});

function deps(adapter: SourceAdapter): {
  deps: IngestSourceDeps;
  delByPrefix: ReturnType<typeof vi.fn>;
} {
  const delByPrefix = vi.fn().mockResolvedValue(undefined);
  const cache = { delByPrefix } as unknown as Cache;

  return {
    delByPrefix,
    deps: {
      db: {} as Database,
      cache,
      adapters: [adapter],
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as unknown as Logger,
    },
  };
}

const adapterFor = (
  items: NormalizedItem[],
  type: SourceAdapter['type'] = 'rss'
): SourceAdapter => ({
  type,
  fetchFeed: vi.fn().mockResolvedValue(items),
});

/** The item inputs handed to `upsertItems` on the first call. */
const storedItems = () =>
  mockUpsertItems.mock.calls[0]![2];

beforeEach(() => {
  mockGetSourceById.mockReset();
  mockUpsertItems.mockReset();
  mockUpsertItems.mockResolvedValue({ total: 1, inserted: 1 });
});

describe('ingestSource', () => {
  it('classifies a news item and stores it', async () => {
    mockGetSourceById.mockResolvedValue(source());
    const { deps: d } = deps(adapterFor([item()]));

    const result = await ingestSource(d, source().id);

    expect(result).toMatchObject({
      fetched: 1,
      inserted: 1,
      failed: false,
    });
    expect(mockUpsertItems).toHaveBeenCalledTimes(1);
    const [input] = storedItems();
    expect(input?.topic).toBe('crime');
  });

  it('leaves a podcast episode untagged, whatever it is about', async () => {
    mockGetSourceById.mockResolvedValue(
      source({ contentType: 'podcast_episode', type: 'rss' })
    );
    const { deps: d } = deps(
      adapterFor([item({ title: 'The court case that changed everything' })])
    );

    await ingestSource(d, source().id);

    const [input] = storedItems();
    // An episode belongs to a show, not to a news topic.
    expect(input?.topic).toBeNull();
  });

  it('always tags a court ruling as court', async () => {
    mockGetSourceById.mockResolvedValue(
      source({ contentType: 'court_ruling', type: 'saflii' })
    );
    const { deps: d } = deps(
      adapterFor(
        [item({ title: 'State Information Technology Agency v Gijima Holdings' })],
        'saflii'
      )
    );

    await ingestSource(d, source().id);

    const [input] = storedItems();
    // A case name matches no keyword; a court-ruling feed must never file one
    // under no topic.
    expect(input?.topic).toBe('court');
  });

  it('invalidates the feed and search caches after inserting', async () => {
    mockGetSourceById.mockResolvedValue(source());
    const { deps: d, delByPrefix } = deps(adapterFor([item()]));

    await ingestSource(d, source().id);

    expect(delByPrefix).toHaveBeenCalledWith('feed:');
    expect(delByPrefix).toHaveBeenCalledWith('search:');
  });

  it('does not touch the cache when nothing new was stored', async () => {
    mockGetSourceById.mockResolvedValue(source());
    mockUpsertItems.mockResolvedValue({ total: 1, inserted: 0 });
    const { deps: d, delByPrefix } = deps(adapterFor([item()]));

    await ingestSource(d, source().id);

    expect(delByPrefix).not.toHaveBeenCalled();
  });

  it('reports a missing source without throwing', async () => {
    mockGetSourceById.mockResolvedValue(null);
    const { deps: d } = deps(adapterFor([]));

    const result = await ingestSource(d, source().id);

    expect(result).toMatchObject({ failed: true, error: 'source not found' });
  });

  it('reports a source type with no adapter', async () => {
    mockGetSourceById.mockResolvedValue(source({ type: 'saflii' }));
    const { deps: d } = deps(adapterFor([]));

    const result = await ingestSource(d, source().id);

    expect(result).toMatchObject({ failed: true });
    expect(result.error).toContain('no adapter for type saflii');
  });

  it('records a failing feed rather than throwing, so the run continues', async () => {
    mockGetSourceById.mockResolvedValue(source());
    const adapter: SourceAdapter = {
      type: 'rss',
      fetchFeed: vi.fn().mockRejectedValue(new Error('responded 503')),
    };
    const { deps: d } = deps(adapter);

    const result = await ingestSource(d, source().id);

    expect(result).toMatchObject({
      failed: true,
      fetched: 0,
      inserted: 0,
      error: 'responded 503',
    });
    expect(mockUpsertItems).not.toHaveBeenCalled();
  });
});

describe('createIngestSourceJob', () => {
  it('runs every job in the batch and returns one result each', async () => {
    mockGetSourceById.mockResolvedValue(source());
    const { deps: d } = deps(adapterFor([item()]));

    const run = createIngestSourceJob(d);
    const results = await run([
      { data: { sourceId: 'a' } },
      { data: { sourceId: 'b' } },
    ] as never);

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.failed === false)).toBe(true);
  });
});
