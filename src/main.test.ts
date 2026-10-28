import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it } from 'bun:test';
import type { Manifest } from 'vite';
import type { ManifestOptions } from 'vite-plugin-pwa';

it('excludes developer code and builds an installable production PWA', async () => {
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

    const editor = manifest['src/components/ui/text-editor/text-editor.tsx'];
    expect(editor).toBeDefined();
    const editorCode = await Bun.file(join(directory, editor.file)).text();
    expect(/\bconsole\.(?:log|debug|info)\s*\(/.test(editorCode)).toBe(false);

    const entry = await Bun.file(join(directory, manifest['index.html'].file)).text();
    expect(entry).not.toMatch(/["']\/(?:debug|sandbox)["']/);

    const serviceWorker = await Bun.file(join(directory, 'sw.js')).text();
    expect(serviceWorker).toContain('precacheAndRoute');
    expect(serviceWorker).not.toMatch(/(?:debug|sandbox-layout|story-page)-[^"']+\.js/);

    const webManifest: ManifestOptions = await Bun.file(
      join(directory, 'manifest.webmanifest'),
    ).json();
    expect(webManifest).toMatchObject({
      name: 'Laneway',
      short_name: 'Laneway',
      start_url: '/',
      display: 'standalone',
      theme_color: '#2783eb',
      background_color: '#fafafa',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    const html = await Bun.file(join(directory, 'index.html')).text();
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain(`<meta name="theme-color" content="${webManifest.theme_color}"`);
    expect(html).toContain('<link rel="icon" href="/favicon.svg"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"');

    for (const [file, size] of [
      ['pwa-192x192.png', 192],
      ['pwa-512x512.png', 512],
      ['apple-touch-icon.png', 180],
    ] as const) {
      const png = Buffer.from(await Bun.file(join(directory, file)).arrayBuffer());
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
      expect(serviceWorker).toContain(`url:"${file}"`);
    }
    expect(await Bun.file(join(directory, 'favicon.svg')).exists()).toBe(true);
    expect(serviceWorker).toContain('url:"favicon.svg"');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
