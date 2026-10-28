import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it, spyOn } from 'bun:test';
import { loadConfigFromFile } from 'vite';
import * as pwa from 'vite-plugin-pwa';

const tailscaleUrl = process.env.PORTLESS_TAILSCALE_URL;
const directories: string[] = [];

afterEach(async () => {
  if (tailscaleUrl === undefined) {
    delete process.env.PORTLESS_TAILSCALE_URL;
  } else {
    process.env.PORTLESS_TAILSCALE_URL = tailscaleUrl;
  }
  await Promise.all(
    directories.map((directory) => rm(directory, { recursive: true, force: true })),
  );
  directories.length = 0;
});

async function loadAllowedHosts() {
  const result = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    `${import.meta.dir}/vite.config.ts`,
    import.meta.dir,
    'silent',
  );

  expect(result).not.toBeNull();
  return result?.config.server?.allowedHosts;
}

it('does not allow additional hosts without a Tailscale preview URL', async () => {
  delete process.env.PORTLESS_TAILSCALE_URL;

  expect(await loadAllowedHosts()).toEqual([]);
});

it('allows only the current Tailscale preview hostname', async () => {
  process.env.PORTLESS_TAILSCALE_URL = 'https://laneway.tail123.ts.net:8443';

  expect(await loadAllowedHosts()).toEqual(['laneway.tail123.ts.net']);
});

it('caches catalogues with a network-first fallback without caching provider APIs', async () => {
  const createPWA = spyOn(pwa, 'VitePWA');

  try {
    await loadAllowedHosts();
    const rules = createPWA.mock.calls[0]?.[0]?.workbox?.runtimeCaching ?? [];

    expect(rules).toHaveLength(1);
    const [rule] = rules;
    expect(rule).toMatchObject({
      handler: 'NetworkFirst',
      options: {
        cacheName: 'laneway-catalogues',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 3 },
      },
    });
    expect(typeof rule.urlPattern).toBe('function');
    const matches = rule.urlPattern as (context: { url: URL; sameOrigin: boolean }) => boolean;
    const origin = 'https://laneway.example';

    for (const path of ['/models.json', '/assistants.json', '/presets.json']) {
      expect(matches({ url: new URL(path, origin), sameOrigin: true })).toBe(true);
      for (const host of ['https://openrouter.ai', 'https://api.openai.com']) {
        expect(matches({ url: new URL(path, host), sameOrigin: false })).toBe(false);
      }
    }
    for (const value of [
      'https://openrouter.ai/api/v1/models',
      'https://openrouter.ai/api/v1/chat/completions',
      'https://api.openai.com/v1/chat/completions',
      `${origin}/api/v1/models`,
      `${origin}/models.json/extra`,
      `${origin}/other.json`,
    ]) {
      const url = new URL(value);
      expect(matches({ url, sameOrigin: url.origin === origin })).toBe(false);
    }
  } finally {
    createPWA.mockRestore();
  }
});

async function loadBuildInfo(env: Record<string, string | undefined> = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'laneway-vite-config-'));
  directories.push(directory);
  await writeFile(join(directory, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  const child = Bun.spawn(
    [
      'node',
      '--input-type=module',
      '-e',
      `import { loadConfigFromFile } from ${JSON.stringify(import.meta.resolve('vite'))};
      await loadConfigFromFile(
        { command: 'build', mode: 'production' },
        ${JSON.stringify(`${import.meta.dir}/vite.config.ts`)},
        ${JSON.stringify(import.meta.dir)},
        'silent',
      );
      console.log(JSON.stringify({
        branch: process.env.VITE_GIT_BRANCH_NAME,
        hash: process.env.VITE_GIT_COMMIT_HASH,
        version: process.env.VITE_APP_VERSION,
        license: process.env.VITE_APP_LICENSE ?? null,
      }));`,
    ],
    {
      cwd: directory,
      env: {
        ...process.env,
        CF_PAGES: undefined,
        CF_PAGES_BRANCH: undefined,
        CF_PAGES_COMMIT_SHA: undefined,
        VITE_APP_LICENSE: undefined,
        ...env,
      },
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  expect(stderr).toBe('');
  expect(exitCode).toBe(0);
  return JSON.parse(stdout);
}

it('loads outside a Git checkout without injecting an undefined license', async () => {
  expect(await loadBuildInfo()).toEqual({
    branch: 'unknown',
    hash: 'unknown',
    version: '1.2.3',
    license: null,
  });
});

it('uses Cloudflare Pages metadata without a Git checkout', async () => {
  expect(
    await loadBuildInfo({
      CF_PAGES: '1',
      CF_PAGES_BRANCH: 'next',
      CF_PAGES_COMMIT_SHA: 'abcdef0123456789',
    }),
  ).toEqual({
    branch: 'next',
    hash: 'abcdef0',
    version: '1.2.3',
    license: null,
  });
});

it('uses unknown when Cloudflare Pages metadata is missing', async () => {
  expect(await loadBuildInfo({ CF_PAGES: '1' })).toEqual({
    branch: 'unknown',
    hash: 'unknown',
    version: '1.2.3',
    license: null,
  });
});
