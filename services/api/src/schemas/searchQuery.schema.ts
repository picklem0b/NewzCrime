/** Query validation for `GET /v1/search` and `/v1/search/sources`. */

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { z } from 'zod';

const contentTypes = [
  'article',
  'court_ruling',
  'podcast_episode',
  'video',
] as const;

const topics = ['court', 'crime', 'politics', 'world'] as const;

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

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  type: z.enum(contentTypes).optional(),
  topic: z.enum(topics).optional(),
  sourceId: z.string().uuid().optional(),
  sourceIds: sourceIdList,
  /** Inclusive lower bound; the app sends an ISO timestamp. */
  from: z.string().datetime().optional(),
  /** Inclusive upper bound; the app sends an ISO timestamp. */
  to: z.string().datetime().optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

/**
 * Directory search is intentionally smaller than item search: a reader wants
 * the handful of channels or shows whose name matches, not a paginated list of
 * every source that mentions the term in its description.
 */
export const sourceSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SourceSearchQueryInput = z.infer<typeof sourceSearchQuerySchema>;
