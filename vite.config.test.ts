import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'bun:test';
import { loadConfigFromFile } from 'vite';

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
