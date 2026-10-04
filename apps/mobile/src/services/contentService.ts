/**
 * Typed wrappers over the `/v1` content endpoints.
 *
 * Hooks call these rather than reaching for the client directly, so paths and
 * parameter names are written once.
 */

import type { ContentItem, ItemTopic, Paginated, Source, Topic } from '@newzcrime/shared';

import { apiClient } from './apiService';

export interface FeedParams {
  topic?: Topic;
  itemTopic?: ItemTopic;
  sourceId?: string;
  includePodcasts?: boolean;
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

export interface PageParams {
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

export const contentService = {
  feed(params: FeedParams = {}): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>('/v1/feed', {
      signal: params.signal,
      query: {
        topic: params.topic ?? 'all',
        sourceId: params.sourceId,
        includePodcasts: params.includePodcasts ? '1' : undefined,
        cursor: params.cursor,
        limit: params.limit,
      },
    });
  },

  item(itemId: string, signal?: AbortSignal): Promise<ContentItem> {
    return apiClient.get<ContentItem>(`/v1/items/${itemId}`, { signal });
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

  search(
    query: string,
    params: PageParams = {}
  ): Promise<Paginated<ContentItem>> {
    return apiClient.get<Paginated<ContentItem>>('/v1/search', {
      signal: params.signal,
      query: { q: query, cursor: params.cursor, limit: params.limit },
    });
  },
};
