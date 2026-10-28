import { afterEach, beforeEach, expect, it } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'laneway-generate-data-'));
});

afterEach(() => rm(directory, { recursive: true, force: true }));

async function runGenerator(
  fetchResult = "Promise.reject(new Error('Unexpected network request'))",
) {
  const preload = join(directory, 'fetch.ts');
  await writeFile(preload, `globalThis.fetch = () => ${fetchResult};`);
  const child = Bun.spawn(
    [process.execPath, '--preload', preload, join(import.meta.dir, 'generate-data.ts')],
    {
      cwd: directory,
      env: { ...process.env, NODE_ENV: 'production' },
      stdout: 'ignore',
      stderr: 'pipe',
    },
  );
  const [exitCode, stderr] = await Promise.all([
    child.exited,
    new Response(child.stderr).text(),
  ]);
  return { exitCode, stderr };
}

it.each([
  { name: 'network errors', fetchResult: "Promise.reject(new Error('Offline'))" },
  {
    name: 'HTTP errors',
    fetchResult: 'Promise.resolve(new Response(null, { status: 503 }))',
  },
  { name: 'invalid JSON', fetchResult: "Promise.resolve(new Response('{'))" },
])('exits unsuccessfully on $name', async ({ fetchResult }) => {
  const result = await runGenerator(fetchResult);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Error generating models:');
  expect(await Bun.file(join(directory, 'public/models.json')).exists()).toBe(false);
});

it('exits unsuccessfully when generated files cannot be written', async () => {
  await writeFile(join(directory, 'models.json'), JSON.stringify({ data: [] }));
  await writeFile(join(directory, 'public'), 'Not a directory');

  const result = await runGenerator();

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('Error writing models to file:');
});

it('writes the generated catalogues and exits successfully', async () => {
  await writeFile(join(directory, 'models.json'), JSON.stringify({ data: [] }));

  const result = await runGenerator();

  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe('');
  for (const name of ['models', 'assistants', 'presets']) {
    const data = await Bun.file(join(directory, 'public', `${name}.json`)).json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  }
});
