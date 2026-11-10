import { expect, it } from 'bun:test';

// The hook needs effects to run, and `bun test` loads Solid's server build where they never do.
// So the script runs in a browser-conditioned process, as src/store/client-build.test.ts does.
async function runInClientBuild<T>(script: string): Promise<T> {
  const child = Bun.spawn([process.execPath, '--conditions=browser', '--eval', script], {
    cwd: import.meta.dir,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  expect(exitCode, stderr).toBe(0);
  return JSON.parse(stdout);
}

const INTERVAL = 40;
const MAX_LAG = 120;

// Records every text the paced copy shows while `steps` changes the source. Units are words.
const record = (
  steps: string,
  pacing = `{ interval: ${INTERVAL}, maxLag: ${MAX_LAG}, ends }`,
) => `
  const { createEffect, createRoot, createSignal } = await import('solid-js');
  const { createPacedText } = await import(
    ${JSON.stringify(new URL('./create-paced-text.ts', import.meta.url).href)}
  );
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const ends = (text) => [...text.matchAll(/\\S+(?=\\s)/g)].map((m) => m.index + m[0].length);
  const words = (count) => Array.from({ length: count }, (_, i) => 'w' + i + ' ').join('');
  const shown = [];
  const [source, setSource] = createSignal('');
  const dispose = createRoot((dispose) => {
    const text = createPacedText(source, () => (${pacing}));
    createEffect(() => shown.push(text()));
    return dispose;
  });
  ${steps}
  dispose();
  console.log(JSON.stringify(shown));
`;

it('shows the first unit at once and holds back the unit being written', async () => {
  const shown = await runInClientBuild<string[]>(
    record(`
      setSource('One two thr');
      const early = shown.length;
      await sleep(${INTERVAL * 4});
      shown.push(String(early));
    `),
  );

  expect(shown).toEqual(['', 'One', 'One two', '2']);
});

it('shows text that is already there when the lane is created whole', async () => {
  const shown = await runInClientBuild<string>(`
    const { createRoot } = await import('solid-js');
    const { createPacedText } = await import(
      ${JSON.stringify(new URL('./create-paced-text.ts', import.meta.url).href)}
    );
    const ends = (text) => [...text.matchAll(/\\S+(?=\\s)/g)].map((m) => m.index + m[0].length);
    createRoot((dispose) => {
      const text = createPacedText(
        () => 'Already here and unfin',
        () => ({ interval: 1000, maxLag: 4000, ends }),
      );
      queueMicrotask(() => {
        console.log(JSON.stringify(text()));
        dispose();
      });
    });
  `);

  expect(shown).toBe('Already here and');
});

it('starts at the usual pace after a pause, because nothing is behind yet', async () => {
  const shown = await runInClientBuild<string[]>(
    record(`
      setSource('One ');
      await sleep(${MAX_LAG * 3});
      setSource('One two three ');
      await sleep(${INTERVAL * 4});
    `),
  );

  expect(shown).toEqual(['', 'One', 'One two', 'One two three']);
});

it('shows several units at a time to catch up with a backlog', async () => {
  const shown = await runInClientBuild<string[]>(
    record(`
      setSource('first ');
      setSource('first ' + words(30));
      await sleep(${INTERVAL * 14});
    `),
  );
  const reveals = shown.slice(2);
  const wordsIn = (text: string) => text.split(' ').length;

  // One at a time would take thirty intervals. The first share alone is a third of the backlog.
  expect(wordsIn(reveals[0]) - 1).toBeGreaterThanOrEqual(10);
  expect(reveals.length).toBeLessThanOrEqual(10);
  expect(shown.at(-1)?.endsWith('w29')).toBe(true);
});

it('clears at once, drops a waiting reveal and shows the next answer without a wait', async () => {
  const shown = await runInClientBuild<string[]>(
    record(`
      setSource('One ');
      setSource('One two ');
      setSource('');
      setSource('Next answer ');
      await sleep(${INTERVAL * 3});
    `),
  );

  expect(shown).toEqual(['', 'One', '', 'Next', 'Next answer']);
});

it('shows the whole source as it is when there is no pacing', async () => {
  const shown = await runInClientBuild<string[]>(
    record(
      `
        setSource('One two thr');
        setSource('One two three');
      `,
      'undefined',
    ),
  );

  expect(shown).toEqual(['', 'One two thr', 'One two three']);
});
