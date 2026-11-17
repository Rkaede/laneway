import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { NewerBackupError, restoreDatabase } from '~/db/backup';
import { createDatabase } from '~/db/create';
import { MIGRATIONS } from '~/db/schema';
import { createDatabaseSync, loadMessages } from '~/db/sync';
import { createTar, gunzip, gzip, readTar } from '~/services/archive';
import { imageCache } from '~/services/image-cache';
import type { MessageProps } from '~/types';
import * as util from '~/util';

import { createBackup, exportBackup, readBackupFile } from './backup';
import { createDefaultState, type State } from './default-state';

let db: PGlite;
let images: Map<string, Blob>;

beforeEach(async () => {
  db = await createDatabase();
  images = new Map();
  spyOn(imageCache, 'get').mockImplementation(async (id) => images.get(id) ?? null);
});

afterEach(async () => {
  mock.restore();
  await db.close();
});

const imageMessage = (id: string, storageId: string): MessageProps => ({
  id,
  role: 'user',
  content: [
    { type: 'text', text: `Message ${id}` },
    { type: 'image', image: { filename: 'photo.png', storageId } },
  ],
});

/** A state with one saved chat in the database, and a draft only the store holds. */
async function savedState() {
  const state = createDefaultState();
  state.sessions = [
    { id: 'saved', title: 'Saved', type: 'chat', created: 5, chats: ['chat'], input: '' },
  ];
  state.chats = [
    { id: 'chat', status: 'idle', modelId: 'model', messages: [imageMessage('m1', 'photo')] },
  ];
  state.draftChats[0].messages = [imageMessage('draft-message', 'draft')];
  state.settings.theme = 'dark';
  images.set('photo', new Blob([new Uint8Array([0, 1, 254, 255])], { type: 'image/png' }));
  images.set('draft', new Blob(['draft bytes'], { type: 'image/jpeg' }));
  await createDatabaseSync({ getDatabase: async () => db, getState: () => state }).sync();
  return state;
}

async function archiveFiles(file: Blob) {
  return readTar(await gunzip(file));
}

async function archive(files: Record<string, string | Uint8Array<ArrayBuffer>>) {
  return gzip(createTar(Object.entries(files).map(([name, data]) => ({ name, data }))));
}

describe('backup archives', () => {
  it('holds the tables, the rest of the store and every image', async () => {
    const state = await savedState();
    const { file, omittedImages } = await createBackup(state, db);

    expect(omittedImages).toBe(0);
    const files = await archiveFiles(file);
    const manifest = JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
    expect(manifest).toMatchObject({ format: 'laneway-backup', version: 2, schema: 1 });
    expect(manifest.images).toEqual([
      { id: 'photo', type: 'image/png' },
      { id: 'draft', type: 'image/jpeg' },
    ]);
    const saved = JSON.parse(new TextDecoder().decode(files.get('state.json')));
    expect(saved.sessions).toEqual([]);
    expect(saved.chats).toEqual([]);
    expect(saved.settings.theme).toBe('dark');
    expect(saved.dialogs).toBeUndefined();
    expect([...files.keys()]).toContain('tables/messages.bin');
  });

  it('restores into another database, with the store and images', async () => {
    const state = await savedState();
    const backup = await readBackupFile((await createBackup(state, db)).file);
    if (backup.kind !== 'archive') throw new Error('Expected an archive');

    const target = await createDatabase();
    try {
      const result = await restoreDatabase(target, backup.database);
      expect(result.images).toEqual(['photo']);
      const messages = await loadMessages(target, ['chat']);
      expect(messages.get('chat')).toEqual(state.chats[0].messages);
    } finally {
      await target.close();
    }
    expect(backup.state.settings.theme).toBe('dark');
    expect(backup.state.sessions).toEqual([]);
    expect(backup.state.draftChats[0].messages).toEqual(state.draftChats[0].messages);
    expect(new Uint8Array(await backup.images.get('photo')!.arrayBuffer())).toEqual(
      new Uint8Array([0, 1, 254, 255]),
    );
    expect(backup.images.get('photo')!.type).toBe('image/png');
    expect(await backup.images.get('draft')!.text()).toBe('draft bytes');
  });

  it('still exports when images are missing or unreadable, and counts them', async () => {
    const state = await savedState();
    images.delete('photo');
    spyOn(imageCache, 'get').mockImplementation(async (id) => {
      if (id === 'draft') throw new Error('Storage blocked');
      return images.get(id) ?? null;
    });

    const { file, omittedImages } = await createBackup(state, db);

    expect(omittedImages).toBe(2);
    const files = await archiveFiles(file);
    expect(JSON.parse(new TextDecoder().decode(files.get('manifest.json'))).images).toEqual([]);
  });

  it('downloads a dated .tar.gz and returns the omitted image count', async () => {
    const state = await savedState();
    images.delete('draft');
    const download = spyOn(util, 'download').mockImplementation(() => {});

    expect(await exportBackup(state, db)).toBe(1);

    const [file, filename] = download.mock.calls[0];
    expect(filename).toMatch(/^laneway-backup-.*\.tar\.gz$/);
    expect((file as Blob).type).toBe('application/gzip');
  });

  it('reads JSON backups too', async () => {
    const backup = await readBackupFile(new Blob([JSON.stringify(createDefaultState())]));
    expect(backup.kind).toBe('json');
  });

  describe('rejects before writing anything', () => {
    async function validFiles(): Promise<Record<string, string | Uint8Array<ArrayBuffer>>> {
      const files = await archiveFiles((await createBackup(await savedState(), db)).file);
      return Object.fromEntries(files);
    }

    async function withManifest(change: (manifest: Record<string, unknown>) => void) {
      const files = await validFiles();
      const manifest = JSON.parse(
        new TextDecoder().decode(files['manifest.json'] as Uint8Array),
      );
      change(manifest);
      return archive({ ...files, 'manifest.json': JSON.stringify(manifest) });
    }

    it('a damaged archive', async () => {
      const file = await gzip(new Blob(['not a tar archive at all'.repeat(40)]));
      expect(readBackupFile(file)).rejects.toThrow('Invalid Laneway backup');
    });

    it('a newer schema', async () => {
      const file = await withManifest((manifest) => {
        manifest.schema = MIGRATIONS.length + 1;
      });
      expect(readBackupFile(file)).rejects.toBeInstanceOf(NewerBackupError);
    });

    it('another format version', async () => {
      const file = await withManifest((manifest) => {
        manifest.version = 3;
      });
      expect(readBackupFile(file)).rejects.toThrow('Unsupported backup format');
    });

    it.each([
      [
        'a table name that is not an identifier',
        { name: 'kv; drop table sessions', columns: ['key'] },
      ],
      ['a column name that is not an identifier', { name: 'kv', columns: ['key"); --'] }],
      ['a table with no columns', { name: 'kv', columns: [] }],
    ])('%s', async (_, table) => {
      const file = await withManifest((manifest) => {
        manifest.tables = [table];
      });
      expect(readBackupFile(file)).rejects.toThrow('Invalid Laneway backup');
    });

    it('a missing table file', async () => {
      const files = await validFiles();
      delete files['tables/messages.bin'];
      expect(readBackupFile(await archive(files))).rejects.toThrow('Invalid Laneway backup');
    });

    it('a missing image file', async () => {
      const files = await validFiles();
      delete files['images/0'];
      expect(readBackupFile(await archive(files))).rejects.toThrow('Invalid Laneway backup');
    });

    it('an invalid store', async () => {
      const files = await validFiles();
      const state = JSON.parse(
        new TextDecoder().decode(files['state.json'] as Uint8Array),
      ) as State;
      files['state.json'] = JSON.stringify({ ...state, settings: { theme: 7 } });
      expect(readBackupFile(await archive(files))).rejects.toThrow('Invalid Laneway backup');
    });
  });
});
