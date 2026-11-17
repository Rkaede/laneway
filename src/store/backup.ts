import type { PGliteInterface } from '@electric-sql/pglite';
import { nanoid } from 'nanoid';
import { createStore, reconcile, type SetStoreFunction } from 'solid-js/store';

import { getStreamCursor, getStreamDisplayMode } from '~/constants';
import { type DatabaseDump, dumpDatabase, NewerBackupError } from '~/db/backup';
import { MIGRATIONS } from '~/db/schema';
import { createTar, gunzip, gzip, isGzip, readTar } from '~/services/archive';
import { imageCache } from '~/services/image-cache';
import type { ImagePart, MessageProps } from '~/types';
import { download, filenameDate } from '~/util';

import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState, type State } from './default-state';
import { migrateStore } from './migrations';

/** A backup from before the database: the whole store as JSON, with images in base64. */
export type JsonBackup = {
  kind: 'json';
  state: State;
  images: Map<string, Blob>;
  legacy: boolean;
};

/** A backup archive: the database's tables, the rest of the store, and the images. */
export type ArchiveBackup = {
  kind: 'archive';
  state: State;
  database: DatabaseDump;
  /** Image blobs by image cache id. */
  images: Map<string, Blob>;
};

export type Backup = JsonBackup | ArchiveBackup;

const ARCHIVE_VERSION = 2;

function valid(condition: unknown): asserts condition {
  if (!condition) throw new Error('Invalid Laneway backup.');
}

/** Runs code that assumes a valid store, reporting a crash on an unexpected shape as invalid. */
function invalidOnError<T>(read: () => T) {
  try {
    return read();
  } catch {
    throw new Error('Invalid Laneway backup.');
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesShape(value: unknown, shape: unknown): boolean {
  if (shape === undefined) return true;
  if (Array.isArray(shape)) {
    return Array.isArray(value) && value.every((item) => matchesShape(item, shape[0]));
  }
  if (isObject(shape)) {
    return (
      isObject(value) &&
      Object.entries(shape).every(([key, item]) => matchesShape(value[key], item))
    );
  }
  return typeof value === typeof shape;
}

// A streamed reply is held in `latest` without an id until it completes, so only saved messages
// must have one.
function validateMessage(message: unknown, { requireId = true } = {}) {
  valid(isObject(message) && matchesShape(message, { role: '' }));
  valid(typeof message.id === 'string' || (!requireId && message.id === undefined));
  valid(['user', 'assistant', 'system', 'tool'].includes(String(message.role)));
  if (typeof message.content === 'string') return;
  valid(Array.isArray(message.content));
  for (const part of message.content) {
    valid(isObject(part));
    if (part.type === 'text') valid(typeof part.text === 'string');
    else {
      valid(part.type === 'image' && isObject(part.image));
      valid(matchesShape(part.image, { filename: '', storageId: '' }));
      valid(
        part.image.sourceType === undefined ||
          part.image.sourceType === 'store' ||
          part.image.sourceType === 'path',
      );
    }
  }
}

function messageOwners(state: State): { messages?: MessageProps[]; latest?: MessageProps }[] {
  return [
    ...state.chats,
    ...state.draftChats,
    ...state.assistants,
    ...state.presets.flatMap((preset) => preset.chats),
  ];
}

function imageParts(state: State) {
  const messages = messageOwners(state).flatMap((owner) => [
    ...(owner.messages ?? []),
    ...(owner.latest ? [owner.latest] : []),
  ]);
  return messages.flatMap((message) =>
    typeof message.content === 'string'
      ? []
      : message.content.filter((part): part is ImagePart => part.type === 'image'),
  );
}

function imageKey(part: ImagePart) {
  return `${part.image.sourceType ?? 'store'}:${part.image.storageId}`;
}

/** Image cache ids used by messages in the store, outside saved chats when those are left out. */
export function stateImageIds(state: State) {
  return imageParts(state)
    .filter((part) => (part.image.sourceType ?? 'store') === 'store')
    .map((part) => part.image.storageId);
}

/**
 * Packs the database's tables, the rest of the store and every stored image into one gzipped tar
 * archive. Saved chats come from the database, so the store's copy of them is left out. Images
 * the app ships with (`sourceType: 'path'`) stay as paths.
 */
export async function createBackup(state: State, db: PGliteInterface) {
  const { dump, images: databaseImages } = await dumpDatabase(db);
  const rest = JSON.parse(serializeChatStore({ ...state, sessions: [], chats: [] })) as State;
  const images: { id: string; blob: Blob }[] = [];
  let omittedImages = 0;
  for (const id of new Set([...databaseImages, ...stateImageIds(rest)])) {
    try {
      const blob = await imageCache.get(id);
      if (!blob) throw new Error(`Image missing from storage: ${id}`);
      images.push({ id, blob });
    } catch {
      omittedImages++;
    }
  }
  const manifest = {
    format: 'laneway-backup',
    version: ARCHIVE_VERSION,
    created: new Date().toISOString(),
    schema: dump.schema,
    tables: dump.tables.map(({ name, columns }) => ({ name, columns })),
    // Image ids become file names by position, so any id is safe in the archive.
    images: images.map(({ id, blob }) => ({ id, type: blob.type })),
  };
  const archive = createTar([
    { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
    { name: 'state.json', data: JSON.stringify(rest) },
    ...dump.tables.map((table) => ({ name: `tables/${table.name}.bin`, data: table.data })),
    ...images.map(({ blob }, index) => ({ name: `images/${index}`, data: blob })),
  ]);
  return {
    file: new Blob([await gzip(archive)], { type: 'application/gzip' }),
    omittedImages,
  };
}

export async function exportBackup(state: State, db: PGliteInterface) {
  const { file, omittedImages } = await createBackup(state, db);
  download(file, `laneway-backup-${filenameDate()}.tar.gz`);
  return omittedImages;
}

/** Postgres identifiers as Laneway's schema writes them, safe to put in a COPY statement. */
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

async function parseArchive(file: Blob): Promise<ArchiveBackup> {
  let files: ReturnType<typeof readTar>;
  try {
    files = readTar(await gunzip(file));
  } catch {
    throw new Error('Invalid Laneway backup.');
  }
  const read = (name: string) => {
    const data = files.get(name);
    valid(data);
    return data;
  };
  const json = (name: string): unknown => JSON.parse(new TextDecoder().decode(read(name)));

  const manifest = json('manifest.json');
  valid(isObject(manifest));
  if (manifest.format !== 'laneway-backup' || manifest.version !== ARCHIVE_VERSION) {
    throw new Error('Unsupported backup format or version.');
  }
  const schema = manifest.schema;
  valid(typeof schema === 'number' && Number.isInteger(schema) && schema >= 1);
  if (schema > MIGRATIONS.length) throw new NewerBackupError();

  valid(Array.isArray(manifest.tables));
  const tables = manifest.tables.map((table: unknown) => {
    valid(isObject(table) && typeof table.name === 'string' && IDENTIFIER.test(table.name));
    const columns = table.columns;
    valid(Array.isArray(columns) && columns.length > 0);
    valid(columns.every((column) => typeof column === 'string' && IDENTIFIER.test(column)));
    return {
      name: table.name,
      columns: columns as string[],
      data: new Blob([read(`tables/${table.name}.bin`)]),
    };
  });
  valid(new Set(tables.map((table) => table.name)).size === tables.length);

  valid(Array.isArray(manifest.images));
  const images = new Map<string, Blob>();
  manifest.images.forEach((image: unknown, index) => {
    valid(isObject(image) && typeof image.id === 'string' && image.id.length > 0);
    valid(typeof image.type === 'string');
    images.set(image.id, new Blob([read(`images/${index}`)], { type: image.type }));
  });

  const state = validateState(json('state.json'));
  // Saved sessions and chats come from the database.
  state.sessions = [];
  state.chats = [];
  return { kind: 'archive', state, database: { schema, tables }, images };
}

/** Reads a backup file in either format, checking it before anything is written. */
export async function readBackupFile(file: Blob): Promise<Backup> {
  if (await isGzip(file)) return parseArchive(file);
  return parseBackup(await file.text());
}

/** Checks a saved store and runs its migrations. */
function validateState(raw: unknown): State {
  valid(isObject(raw));
  valid(
    raw.schemaVersion === undefined ||
      (typeof raw.schemaVersion === 'number' &&
        raw.schemaVersion >= 0 &&
        raw.schemaVersion <= createDefaultState().schemaVersion),
  );
  const sessionShape = { id: '', title: '', type: '', created: 0, chats: [''] };
  valid(
    matchesShape(raw, {
      sessions: [sessionShape],
      draftSession: sessionShape,
      chats: [{ id: '', status: '', messages: [] }],
      draftChats: [{ id: '', status: '', messages: [] }],
      assistants: [{ id: '', title: '', modelId: '' }],
      presets: [{ id: '', type: '', chats: [{ status: '' }] }],
      settings: {},
    }),
  );
  const state = invalidOnError(() => deserializeChatStore(JSON.stringify(raw)));
  for (const chat of [...state.chats, ...state.draftChats]) {
    valid(['idle', 'loading', 'error', 'canceled'].includes(chat.status));
  }
  // A parent may be missing from the backup (deleted before export), so only the shape is checked.
  for (const session of [...state.sessions, state.draftSession]) {
    valid(
      session.branch === undefined ||
        matchesShape(session.branch, {
          parentId: '',
          parentTitle: '',
          messageId: '',
          forkedMessageId: '',
        }),
    );
  }
  for (const owner of messageOwners(state)) {
    if (owner.messages !== undefined) {
      valid(Array.isArray(owner.messages));
      for (const message of owner.messages) validateMessage(message);
    }
    if (owner.latest !== undefined) validateMessage(owner.latest, { requireId: false });
  }
  const [migrated, setMigrated] = createStore(state);
  invalidOnError(() => migrateStore(migrated, setMigrated));
  const defaults = createDefaultState();
  valid(matchesShape(migrated.settings, defaults.settings));
  valid(
    getStreamDisplayMode(migrated.settings.streaming.display).id ===
      migrated.settings.streaming.display,
  );
  valid(
    getStreamCursor(migrated.settings.streaming.cursor).id ===
      migrated.settings.streaming.cursor,
  );
  valid(matchesShape(migrated.featureFlags, defaults.featureFlags));
  valid(matchesShape(migrated.speedDial, [{ id: '' }]));
  state.dialogs = defaults.dialogs;
  return state;
}

/** Reads a JSON backup, from before backups held the database. */
export function parseBackup(serialized: string): JsonBackup {
  const data: unknown = JSON.parse(serialized);
  valid(isObject(data));
  const legacy = !('format' in data);
  if (!legacy && (data.format !== 'laneway-backup' || data.version !== 1)) {
    throw new Error('Unsupported backup format or version.');
  }
  const state = validateState(legacy ? data : data.state);

  const images = new Map<string, Blob>();
  if (!legacy) {
    valid(isObject(data.images));
    const keys = new Set(imageParts(state).map(imageKey));
    for (const [key, image] of Object.entries(data.images)) {
      valid(
        isObject(image) && typeof image.type === 'string' && typeof image.data === 'string',
      );
      const bytes = Uint8Array.from(atob(image.data), (character) => character.charCodeAt(0));
      if (keys.has(key)) images.set(key, new Blob([bytes], { type: image.type }));
    }
  }
  return { kind: 'json', state, images, legacy };
}

export async function restoreBackup(
  backup: JsonBackup,
  current: State,
  setState: SetStoreFunction<State>,
) {
  const state = deserializeChatStore(serializeChatStore(backup.state));
  const imported = new Map<string, string>();
  try {
    for (const [key, blob] of backup.images) {
      const storageId = nanoid();
      imported.set(key, storageId);
      await imageCache.add(storageId, blob);
    }
    for (const part of imageParts(state)) {
      const storageId = imported.get(imageKey(part));
      if (storageId) {
        part.image.storageId = storageId;
        part.image.sourceType = 'store';
      }
    }
  } catch (error) {
    await Promise.allSettled([...imported.values()].map((id) => imageCache.remove(id)));
    throw error;
  }
  for (const chat of [...current.chats, ...current.draftChats]) chat.controller?.abort();
  setState(reconcile(state));
}
