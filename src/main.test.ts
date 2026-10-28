import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'bun:test';
import type { Manifest } from 'vite';

it('excludes developer routes and their chunks from production and the precache', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'laneway-production-'));

  try {
    const child = Bun.spawn(
      [
        'node',
        join(import.meta.dir, '../node_modules/vite/bin/vite.js'),
        'build',
        '--manifest',
        '--outDir',
        directory,
        '--emptyOutDir',
      ],
      {
        cwd: join(import.meta.dir, '..'),
        env: { ...process.env, NODE_ENV: 'production' },
        stdout: 'pipe',
        stderr: 'pipe',
      },
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);

    expect(exitCode, `${stdout}\n${stderr}`).toBe(0);

    const manifest: Manifest = await Bun.file(join(directory, '.vite/manifest.json')).json();
    const developerRoutes = Object.keys(manifest).filter(
      (file) => file === 'src/routes/debug.tsx' || file.startsWith('src/routes/sandbox/'),
    );
    expect(developerRoutes).toEqual([]);
    expect(manifest['src/routes/settings/settings.tsx']).toBeDefined();

    const entry = await Bun.file(join(directory, manifest['index.html'].file)).text();
    expect(entry).not.toMatch(/["']\/(?:debug|sandbox)["']/);

    const serviceWorker = await Bun.file(join(directory, 'sw.js')).text();
    expect(serviceWorker).toContain('precacheAndRoute');
    expect(serviceWorker).not.toMatch(/(?:debug|sandbox-layout|story-page)-[^"']+\.js/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
