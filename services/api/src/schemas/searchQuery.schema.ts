/** Query validation for `GET /v1/search`. */

import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@newzcrime/shared';
import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  cursor: z.string().min(1).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE_MAX)
    .default(PAGE_SIZE_DEFAULT),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
