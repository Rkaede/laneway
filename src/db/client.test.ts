import { expect, it } from 'bun:test';

it('loads PGlite only when the database is first used', async () => {
  // A child process, so modules loaded by other test files do not count.
  const child = Bun.spawn(
    [
      process.execPath,
      '--preload',
      import.meta.resolve('../test/setup'),
      '-e',
      String.raw`await import(${JSON.stringify(import.meta.resolve('./client'))});
      console.log(JSON.stringify(Object.keys(require.cache).filter(
        (name) => name.includes('/node_modules/@electric-sql/'),
      )));`,
    ],
    { cwd: import.meta.dir, stdout: 'pipe', stderr: 'pipe' },
  );
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect(stderr).toBe('');
  expect(exitCode).toBe(0);
  expect(JSON.parse(stdout)).toEqual([]);
});
