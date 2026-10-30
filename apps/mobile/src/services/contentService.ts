/**
 * Typed wrappers over the `/v1` content endpoints.
 *
 * Hooks call these rather than reaching for the client directly, so paths and
 * parameter names are written once.
 */

import type {
  ContentItem,
  ContentType,
  ItemContent,
  ItemTopic,
  Paginated,
  Source,
  Topic,
} from '@newzcrime/shared';

import type { SearchSort } from '@/types';

import { apiClient } from './apiService';

export interface FeedParams {
  topic?: Topic;
  sourceId?: string;
  sourceIds?: string[];
  includePodcasts?: boolean;
  includeVideos?: boolean;
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface PageParams {
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface SearchParams extends PageParams {
  type?: ContentType;
  topic?: ItemTopic;
  sourceId?: string;
  sourceIds?: string[];
  /** ISO timestamp, inclusive lower bound. */
  from?: string;
  /** ISO timestamp, inclusive upper bound. */
  to?: string;
  sort?: SearchSort;
}

export const contentService = {
  feed(params: FeedParams = {}): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>('/v1/feed', {
      signal: params.signal,
      query: {
        topic: params.topic ?? 'all',
        sourceId: params.sourceId,
        sourceIds:
          params.sourceIds && params.sourceIds.length > 0
            ? params.sourceIds.join(',')
            : undefined,
        includePodcasts: params.includePodcasts ? '1' : undefined,
        includeVideos: params.includeVideos ? '1' : undefined,
        cursor: params.cursor,
        limit: params.limit,
      },
    });
  },

  item(itemId: string, signal?: AbortSignal): Promise<ContentItem> {
    return apiClient.get<ContentItem>(`/v1/items/${itemId}`, { signal });
  },

  /**
   * Full text is extracted by the API on first use, which can take a few
   * seconds on a slow publisher. The client's default timeout is enough:
   * the API gives up on a page after nine seconds.
   */
  itemContent(itemId: string, signal?: AbortSignal): Promise<ItemContent> {
    return apiClient.get<ItemContent>(`/v1/items/${itemId}/content`, {
      signal,
    });
  },

  sources(signal?: AbortSignal): Promise<Source[]> {
    return apiClient.get<Source[]>('/v1/sources', { signal });
  },

  source(sourceId: string, signal?: AbortSignal): Promise<Source> {
    return apiClient.get<Source>(`/v1/sources/${sourceId}`, { signal });
  },

  sourceItems(
    sourceId: string,
    params: PageParams = {}
  ): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>(
      `/v1/sources/${sourceId}/items`,
      { signal: params.signal, query: { cursor: params.cursor, limit: params.limit } }
    );
  },

  podcasts(signal?: AbortSignal): Promise<Source[]> {
    return apiClient.get<Source[]>('/v1/podcasts', { signal });
  },

  /** Channels shown on Watch. */
  videoChannels(signal?: AbortSignal): Promise<Source[]> {
    return apiClient.get<Source[]>('/v1/videos/channels', { signal });
  },

  /**
   * The newest videos across every channel. One page is enough for the shelf;
   * an individual channel is paged through `sourceItems`.
   */
  videos(
    params: {
      sourceId?: string;
      limit?: number;
      cursor?: string;
      signal?: AbortSignal;
    } = {}
  ): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>('/v1/videos', {
      signal: params.signal,
      query: {
        sourceId: params.sourceId,
        cursor: params.cursor,
        limit: params.limit ?? 100
      }
    });
  },

  search(
    query: string,
    params: SearchParams = {}
  ): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>('/v1/search', {
      signal: params.signal,
      query: {
        q: query,
        type: params.type,
        topic: params.topic,
        sourceId: params.sourceId,
        sourceIds:
          params.sourceIds && params.sourceIds.length > 0
            ? params.sourceIds.join(',')
            : undefined,
        from: params.from,
        to: params.to,
        sort: params.sort,
        cursor: params.cursor,
        limit: params.limit,
      },
    });
  },

  /** Channels, shows and outlets whose name or description matches. */
  searchSources(query: string, signal?: AbortSignal): Promise<Source[]> {
    return apiClient.get<Source[]>('/v1/search/sources', {
      signal,
      query: { q: query, limit: 30 },
    });
  },
};
