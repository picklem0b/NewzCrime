/**
 * Query validation for `GET /v1/feed`.
 *
 * Values arrive as strings from the query string, so numeric and boolean
 * parameters are coerced here and bounded against the shared pagination limits.
 */

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, TOPIC } from '@newzcrime/shared';
import type { FeedQuery, ItemTopic, Topic } from '@newzcrime/shared';
import { z } from 'zod';

const topicValues = [
  TOPIC.ALL,
  TOPIC.COURT,
  TOPIC.CRIME,
  TOPIC.POLITICS,
  TOPIC.WORLD,
] as const satisfies ReadonlyArray<Topic>;

const booleanFlag = z
  .enum(['1', '0', 'true', 'false'])
  .transform((value) => value === '1' || value === 'true');

/** `?sourceIds=a,b,c` — one page from several followed sources. */
const sourceIdList = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const ids = value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    return ids.length > 0 ? ids : undefined;
  })
  .pipe(z.array(z.string().uuid()).max(50).optional());

export const feedQuerySchema = z.object({
  topic: z.enum(topicValues).default(TOPIC.ALL),
  sourceId: z.string().uuid().optional(),
  sourceIds: sourceIdList,
  includePodcasts: booleanFlag.optional(),
  includeVideos: booleanFlag.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

/** Narrow the validated query to the shared `FeedQuery` contract. */
export function toFeedQuery(input: FeedQueryInput): FeedQuery {
  return {
    topic: input.topic,
    sourceId: input.sourceId,
    sourceIds: input.sourceIds,
    includePodcasts: input.includePodcasts ?? false,
    includeVideos: input.includeVideos ?? false,
    cursor: input.cursor,
    limit: input.limit,
  };
}

/** `all` is a filter value, not a property of an item. */
export function toItemTopic(topic: Topic): ItemTopic | undefined {
  return topic === TOPIC.ALL ? undefined : topic;
}
