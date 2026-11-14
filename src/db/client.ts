import type { PGliteInterface } from '@electric-sql/pglite';

export const DATA_DIR = 'idb://laneway';

let opening: Promise<PGliteInterface> | undefined;

/**
 * The shared database, opened on first use. PGlite and its WASM load only here, so nothing on the
 * startup path waits for them; first paint uses the snapshot in localStorage.
 */
export function getDatabase() {
  opening ??= open().catch((error) => {
    opening = undefined;
    throw error;
  });
  return opening;
}

async function open() {
  const [{ PGliteWorker }, { default: DatabaseWorker }] = await Promise.all([
    import('@electric-sql/pglite/worker'),
    import('./worker?worker'),
  ]);
  const db = new PGliteWorker(new DatabaseWorker({ name: 'laneway-database' }), {
    dataDir: DATA_DIR,
  });
  await db.waitReady;
  return db;
}

let checkpointTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Call after writing. Postgres in PGlite never checkpoints on its own, so without this the
 * write-ahead log, which is held in memory, keeps growing. Bursts of writes share one checkpoint.
 */
export function scheduleCheckpoint(delay = 5000) {
  clearTimeout(checkpointTimer);
  checkpointTimer = setTimeout(() => {
    getDatabase()
      .then((db) => db.exec('checkpoint'))
      .catch((error) => console.warn('Database checkpoint failed.', error));
  }, delay);
}
