/**
 * Path parameter validation.
 *
 * Ids are uuids, so an invalid one is rejected before it reaches a query.
 */

import { z } from 'zod';

export const itemParamsSchema = z.object({
  itemId: z.string().uuid(),
});

export const sourceParamsSchema = z.object({
  sourceId: z.string().uuid(),
});
