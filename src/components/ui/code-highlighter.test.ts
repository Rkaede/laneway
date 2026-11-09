import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { JSX } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);

const directory = await mkdtemp(join(tmpdir(), 'laneway-code-highlighter-'));
afterAll(() => rm(directory, { recursive: true, force: true }));

// A highlighter whose requests the tests settle by hand.
const highlighting = join(directory, 'code-highlighting.mjs');
await Bun.write(
  highlighting,
  `export const requests = [];
export const highlightCode = (code, language) =>
  new Promise((resolve, reject) => requests.push({ code, language, resolve, reject }));
`,
);

// Client reactivity, so the effect runs. The compiled SSR markup is a snapshot, so <Show>
// records its props and the tests render whichever branch is current.
const reactivity = join(directory, 'solid.mjs');
await Bun.write(
  reactivity,
  `export * from ${JSON.stringify(import.meta.resolve('solid-js/dist/solid.js'))};
export const shows = [];
export const Show = (props) => (shows.push(props), '');
`,
);

// Bun doesn't compile Solid JSX. Compile the component for SSR.
const source = await Bun.file(new URL('./code-highlighter.tsx', import.meta.url)).text();
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile CodeHighlighter');
const stubs: Record<string, string> = {
  'solid-js': reactivity,
  './code-highlighting': highlighting,
};
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${stubs[name] ?? import.meta.resolve(name)}${quote}`;
});
const filename = join(directory, 'code-highlighter.mjs');
await Bun.write(filename, code);
const { CodeHighlighter }: typeof import('./code-highlighter') = await import(filename);

type Request = {
  code: string;
  language: string;
  resolve: (html: string) => void;
  reject: (error: Error) => void;
};
const { requests }: { requests: Request[] } = await import(highlighting);
const {
  shows,
}: {
  shows: { when: unknown; fallback: JSX.Element; children: JSX.Element }[];
} = await import(reactivity);

let dispose = () => {};

beforeEach(() => {
  requests.length = 0;
  shows.length = 0;
});

afterEach(() => {
  dispose();
  mock.restore();
});

function setup(initialCode: string) {
  const [code, setCode] = solid.createSignal(initialCode);
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    CodeHighlighter({
      get code() {
        return code();
      },
      language: 'ts',
    });
  });
  const show = shows[0];
  const render = () => renderToString(() => (show.when ? show.children : show.fallback));
  return { setCode, render };
}

// Lets the promise callbacks of a settled request run.
const settled = () => Bun.sleep(0);

describe('CodeHighlighter', () => {
  it('shows the code as escaped plain text until it is highlighted', async () => {
    const { render } = setup('<b>a & b</b>');

    expect(requests.map((request) => [request.code, request.language])).toEqual([
      ['<b>a & b</b>', 'ts'],
    ]);
    expect(render()).toMatch(
      /^<div data-language="ts"><pre class="shiki"[^>]*><code>&lt;b>a &amp; b&lt;\/b><\/code><\/pre><\/div>$/,
    );

    requests[0].resolve('<pre class="shiki css-variables">highlighted</pre>');
    await settled();

    expect(render()).toMatch(
      /^<div data-language="ts"\s*><pre class="shiki css-variables">highlighted<\/pre><\/div>$/,
    );
  });

  it('logs a failure and keeps the code visible as plain text', async () => {
    const logError = spyOn(console, 'error').mockImplementation(() => {});
    const { render } = setup('const value = 1;');
    const failure = new Error('Failed to fetch dynamically imported module');

    requests[0].reject(failure);
    await settled();

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('Failed to highlight code', failure);
    expect(render()).toContain('<code>const value = 1;</code>');
  });

  it('returns to plain text when highlighting fails after it has worked', async () => {
    spyOn(console, 'error').mockImplementation(() => {});
    const { setCode, render } = setup('first');
    requests[0].resolve('<pre>first, highlighted</pre>');
    await settled();

    setCode('second');
    requests[1].reject(new Error('Highlighting failed'));
    await settled();

    expect(render()).toContain('<code>second</code>');
    expect(render()).not.toContain('first');
  });

  it('ignores a result that arrives after a newer request', async () => {
    const logError = spyOn(console, 'error').mockImplementation(() => {});
    const { setCode, render } = setup('one');
    setCode('one two');
    setCode('one two three');
    expect(requests.map((request) => request.code)).toEqual([
      'one',
      'one two',
      'one two three',
    ]);

    requests[0].resolve('<pre>one, highlighted</pre>');
    await settled();
    expect(render()).toContain('<code>one two three</code>');

    requests[2].resolve('<pre>one two three, highlighted</pre>');
    await settled();
    requests[1].reject(new Error('Highlighting failed'));
    await settled();

    expect(render()).toContain('<pre>one two three, highlighted</pre>');
    expect(logError).not.toHaveBeenCalled();
  });
});
