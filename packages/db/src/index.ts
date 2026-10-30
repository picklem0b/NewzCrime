/** `@newzcrime/db` barrel. Implementation lives in the sibling modules. */

export { createDatabase } from './database';
export { decodeCursor, encodeCursor } from './cursor';

export {
  getSourceById,
  listActiveSources,
  listSources,
  mapSource,
  searchSources,
  upsertSource,
} from './repositories/sourceRepository';
export type { UpsertSourceInput } from './repositories/sourceRepository';

export {
  countItems,
  getItemBody,
  getItemById,
  listItems,
  listItemsBySource,
  mapContentItem,
  saveItemBody,
  searchItems,
  upsertItems,
} from './repositories/contentItemRepository';
export type {
  StoredItemBody,
  UpsertItemsResult,
} from './repositories/contentItemRepository';

export type {
  ContentItemInput,
  ContentItemRow,
  Cursor,
  Database,
  DatabaseConfig,
  ItemBodyRow,
  ItemPageQuery,
  SearchQuery,
  SearchSort,
  SourceRow,
} from './types';
