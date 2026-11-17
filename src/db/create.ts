import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { vector } from '@electric-sql/pglite-pgvector';

import { migrate } from './schema';

/**
 * PGlite runs Postgres in single-user mode, where nothing checkpoints on its own, and the write-ahead
 * log grows towards max_wal_size, 1 GB by default. The IndexedDB file system holds the whole data
 * directory in memory, log included, so cap the log and checkpoint after writes (see
 * `scheduleCheckpoint`). `startParams` replaces PGlite's defaults, so they are repeated here.
 */
const START_PARAMS = [
  ...PGlite.defaultStartParams,
  '-c',
  'max_wal_size=32MB',
  '-c',
  'min_wal_size=32MB',
  '-c',
  'wal_recycle=off',
];

/**
 * Opens a database and brings its schema up to date, or up to `schema` when given. With no data
 * directory, it lives in memory.
 */
export async function createDatabase(dataDir?: string, { schema }: { schema?: number } = {}) {
  const db = await PGlite.create({
    dataDir,
    // Queries return before IndexedDB has finished saving, as localStorage writes are debounced.
    relaxedDurability: true,
    extensions: { vector, pg_trgm },
    startParams: START_PARAMS,
  });
  await migrate(db, schema);
  return db;
}
