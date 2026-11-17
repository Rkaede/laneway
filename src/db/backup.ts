import type { PGliteInterface, Transaction } from '@electric-sql/pglite';

import { storedImageIds } from './images';
import { BACKUP_TABLES, DERIVED_TABLES, migrate, MIGRATIONS } from './schema';
import { newGeneration } from './sync';

export type TableDump = { name: string; columns: string[]; data: Blob };

/**
 * Every table's rows in Postgres's binary COPY format, which later Postgres versions still read.
 * Indexes, the write-ahead log and the system catalogs are left out: a backup's schema version
 * says how to rebuild them.
 */
export type DatabaseDump = { schema: number; tables: TableDump[] };

type Queryable = PGliteInterface | Transaction;

async function schemaVersion(db: Queryable) {
  const { rows } = await db.query<{ version: number }>(
    'select coalesce(max(version), 0)::int as version from schema_migrations',
  );
  return rows[0].version;
}

/** Columns that hold data, leaving out generated ones such as `chunks.tsv`. */
async function tableColumns(db: Queryable, table: string) {
  const { rows } = await db.query<{ name: string }>(
    `select column_name as name from information_schema.columns
     where table_schema = 'public' and table_name = $1 and is_generated = 'NEVER'
     order by ordinal_position`,
    [table],
  );
  return rows.map((row) => row.name);
}

const columnList = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');

async function copyIn(db: Queryable, table: TableDump) {
  await db.query(
    `copy ${table.name} (${columnList(table.columns)}) from '/dev/blob' with (format binary)`,
    [],
    { blob: table.data },
  );
}

/** Copies every table out in one transaction, with the image cache ids its messages use. */
export function dumpDatabase(db: PGliteInterface) {
  return db.transaction(async (tx) => {
    const tables: TableDump[] = [];
    for (const name of BACKUP_TABLES) {
      const columns = await tableColumns(tx, name);
      const { blob } = await tx.query(
        `copy ${name} (${columnList(columns)}) to '/dev/blob' with (format binary)`,
      );
      if (!blob) throw new Error(`Unable to read the ${name} table.`);
      tables.push({ name, columns, data: blob });
    }
    const dump: DatabaseDump = { schema: await schemaVersion(tx), tables };
    return { dump, images: await storedImageIds(tx) };
  });
}

/**
 * Loads a dump from an older schema into a database in memory at that schema, runs the later
 * migrations, and dumps it again.
 */
async function upgrade(dump: DatabaseDump): Promise<DatabaseDump> {
  const { createDatabase } = await import('./create');
  const db = await createDatabase(undefined, { schema: dump.schema });
  try {
    await db.transaction(async (tx) => {
      for (const table of dump.tables) await copyIn(tx, table);
    });
    await migrate(db);
    return (await dumpDatabase(db)).dump;
  } finally {
    await db.close();
  }
}

export class NewerBackupError extends Error {
  constructor() {
    super(
      'This backup comes from a newer version of Laneway. Reload to update, then import it.',
    );
  }
}

/**
 * Replaces every table's rows with the dump's, in one transaction, so a failure leaves the data
 * as it was. Returns the image cache ids the old and the new messages use, and the data's new
 * generation, which stops other tabs saving their out-of-date stores over it.
 */
export async function restoreDatabase(db: PGliteInterface, dump: DatabaseDump) {
  if (dump.schema > MIGRATIONS.length) throw new NewerBackupError();
  const current = dump.schema < MIGRATIONS.length ? await upgrade(dump) : dump;
  const result = await db.transaction(async (tx) => {
    const previousImages = await storedImageIds(tx);
    for (const name of [...BACKUP_TABLES].reverse()) await tx.exec(`delete from ${name}`);
    for (const name of DERIVED_TABLES) await tx.exec(`delete from ${name}`);
    for (const table of current.tables) await copyIn(tx, table);
    return {
      previousImages,
      images: await storedImageIds(tx),
      generation: await newGeneration(tx),
    };
  });
  await db.syncToFs();
  return result;
}
