/** `@newzcrime/db` barrel. Implementation lives in the sibling modules. */

export { createDatabase } from './database';
export { decodeCursor, encodeCursor } from './cursor';

export {
  getSourceById,
  listActiveSources,
  listSources,
  mapSource,
  upsertSource,
} from './repositories/sourceRepository';
export type { UpsertSourceInput } from './repositories/sourceRepository';

export {
  countItems,
  getItemById,
  listItems,
  listItemsBySource,
  mapContentItem,
  searchItems,
  upsertItems,
} from './repositories/contentItemRepository';
export type { UpsertItemsResult } from './repositories/contentItemRepository';

export type {
  ContentItemInput,
  ContentItemRow,
  Cursor,
  Database,
  DatabaseConfig,
  ItemPageQuery,
  SearchQuery,
  SourceRow,
} from './types';
