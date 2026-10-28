import { describe, expect, it } from 'bun:test';

import { parseKeybinding } from './tinykeys';

describe('keybinding platform aliases', () => {
  it('preserves explicit modifiers and key sequences', () => {
    expect(parseKeybinding('Shift+KeyK Control+Enter')).toEqual([
      [['Shift'], 'KeyK'],
      [['Control'], 'Enter'],
    ]);
  });

  it.each([
    ['Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Meta', ['Alt+j']],
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'Meta', ['Alt+j']],
    ['iPad', 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)', 'Meta', ['Alt+j']],
    ['iPod', 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)', 'Meta', ['Alt+j']],
    ['Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Control', ['Control+Alt+j']],
    ['Linux', 'Mozilla/5.0 (X11; Linux x86_64)', 'Control', []],
    ['Android', 'Mozilla/5.0 (Linux; Android 15)', 'Control', []],
  ])('uses shared platform detection on %s', async (_name, userAgent, modifier, altGraph) => {
    // A separate browser-conditioned process gives each platform fresh module constants.
    const child = Bun.spawn(
      [
        process.execPath,
        '--conditions=browser',
        '--eval',
        `
          globalThis.window = {
            navigator: { userAgent: ${JSON.stringify(userAgent)}, maxTouchPoints: 2 },
            document: {},
            setTimeout: () => 0,
          };
          globalThis.KeyboardEvent = class extends Event {
            key = 'j';
            code = 'KeyJ';
            getModifierState(modifier) { return modifier === 'AltGraph'; }
          };
          const { parseKeybinding, createKeybindingsHandler } = await import(
            ${JSON.stringify(new URL('./tinykeys.ts', import.meta.url).href)}
          );
          const altGraph = [];
          createKeybindingsHandler({
            'Alt+j': () => altGraph.push('Alt+j'),
            'Control+Alt+j': () => altGraph.push('Control+Alt+j'),
          })(new KeyboardEvent('keydown'));
          console.log(JSON.stringify({ binding: parseKeybinding('$mod+k'), altGraph }));
        `,
      ],
      { stdout: 'pipe', stderr: 'pipe' },
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);

    expect(exitCode, stderr).toBe(0);
    expect(JSON.parse(stdout)).toEqual({ binding: [[[modifier], 'k']], altGraph });
  });
});
