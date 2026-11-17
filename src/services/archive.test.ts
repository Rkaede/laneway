import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'bun:test';

import { createTar, gunzip, gzip, isGzip, readTar } from './archive';

const bytes = (length: number) => Uint8Array.from({ length }, (_, index) => index % 251);

async function roundTrip(entries: Parameters<typeof createTar>[0]) {
  return readTar(await gunzip(await gzip(createTar(entries))));
}

describe('backup archives', () => {
  it('round-trips text, byte arrays and blobs of any length', async () => {
    const files = await roundTrip([
      { name: 'manifest.json', data: '{"version":2}' },
      { name: 'tables/messages.bin', data: bytes(512) },
      { name: 'images/abc_-1', data: new Blob([bytes(70_001)]) },
      { name: 'empty', data: '' },
    ]);

    expect([...files.keys()]).toEqual([
      'manifest.json',
      'tables/messages.bin',
      'images/abc_-1',
      'empty',
    ]);
    expect(new TextDecoder().decode(files.get('manifest.json'))).toBe('{"version":2}');
    expect(files.get('tables/messages.bin')).toEqual(bytes(512));
    expect(files.get('images/abc_-1')).toEqual(bytes(70_001));
    expect(files.get('empty')).toEqual(new Uint8Array());
  });

  it('writes archives that tar can read, and reads archives tar wrote', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'laneway-archive-'));
    try {
      const archive = path.join(directory, 'backup.tar.gz');
      writeFileSync(
        archive,
        new Uint8Array(
          await (
            await gzip(createTar([{ name: 'tables/kv.bin', data: bytes(1000) }]))
          ).arrayBuffer(),
        ),
      );
      const listed = Bun.spawnSync(['tar', '-tzf', archive]);
      expect(listed.stdout.toString().trim()).toBe('tables/kv.bin');

      Bun.spawnSync(['tar', '-xzf', archive, '-C', directory]);
      writeFileSync(path.join(directory, 'note.txt'), 'written by tar');
      Bun.spawnSync(['tar', '--format=ustar', '-cf', 'out.tar', 'note.txt', 'tables/kv.bin'], {
        cwd: directory,
      });
      const files = readTar(new Uint8Array(readFileSync(path.join(directory, 'out.tar'))));
      expect(new TextDecoder().decode(files.get('note.txt'))).toBe('written by tar');
      expect(files.get('tables/kv.bin')).toEqual(bytes(1000));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects damaged and truncated archives', async () => {
    const archive = new Uint8Array(
      await createTar([{ name: 'manifest.json', data: '{}' }]).arrayBuffer(),
    );
    const damaged = archive.slice();
    damaged[0] ^= 1;
    expect(() => readTar(damaged)).toThrow('damaged');
    expect(() => readTar(archive.subarray(0, 512))).toThrow();
    expect(() => readTar(new TextEncoder().encode('{"format":"laneway-backup"}'))).toThrow();
  });

  it('refuses names tar could not store', () => {
    expect(() => createTar([{ name: 'a'.repeat(101), data: '' }])).toThrow();
    expect(() => createTar([{ name: 'spaced name', data: '' }])).toThrow();
  });

  it('tells a backup archive from a JSON backup', async () => {
    expect(await isGzip(await gzip(new Blob(['x'])))).toBe(true);
    expect(await isGzip(new Blob(['{"format":"laneway-backup"}']))).toBe(false);
    expect(await isGzip(new Blob([]))).toBe(false);
  });
});
