import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import type { Mock } from 'bun:test';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { JSX } from 'solid-js';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import { iconsMock } from '../../test/icons-mock';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-chat-input-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export const Button = () => null;
export const Thumbnail = Button;
${Object.keys(iconsMock())
  .map((name) => `export const ${name} = Button;`)
  .join('\n')}
`,
);

// Compile without a DOM, but keep the client For to exercise per-file cleanup.
const source = (await Bun.file(new URL('./chat-input.tsx', import.meta.url)).text()).replace(
  "const TextEditor = lazy(() => import('../ui/text-editor/text-editor'));",
  'const TextEditor = () => null;',
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile ChatInput');
const stubbed = ['~/components/icons/ui', '~/components/ui/button', '../ui'];
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${stubbed.includes(name) ? stubs : import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'chat-input.mjs');
await Bun.write(filename, code);
const { ChatInput }: typeof import('./chat-input') = await import(filename);

let dispose: () => void;
let readAttachments: () => unknown;
let createUrl: Mock<typeof URL.createObjectURL>;
let revokeUrl: Mock<typeof URL.revokeObjectURL>;

function setup(attachments: () => File[]) {
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    ChatInput({
      get attachments() {
        return attachments();
      },
      input: '',
      isLoading: false,
      onInput: () => {},
      onSubmit: () => {},
    });
  });
}

beforeEach(() => {
  dispose = () => {};
  createUrl = spyOn(URL, 'createObjectURL').mockImplementation(
    (file) => `blob:${(file as File).name}`,
  );
  revokeUrl = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const For = solid.For;
  spyOn(solid, 'For').mockImplementation((props) => {
    const children = For(props) as unknown as () => JSX.Element;
    readAttachments = children;
    // A DOM insertion reads the list separately from Show's child computation.
    return solid.untrack(children);
  });
});

afterEach(() => {
  dispose();
  mock.restore();
});

describe('ChatInput object URLs', () => {
  it('revokes only removed attachments and keeps existing URLs until unmount', () => {
    const first = new File(['first'], 'first.png');
    const second = new File(['second'], 'second.png');
    const [attachments, setAttachments] = solid.createSignal([first, second]);
    setup(attachments);

    expect(createUrl.mock.calls).toEqual([[first], [second]]);
    expect(revokeUrl).not.toHaveBeenCalled();

    setAttachments([second]);
    readAttachments();

    expect(createUrl).toHaveBeenCalledTimes(2);
    expect(revokeUrl.mock.calls).toEqual([['blob:first.png']]);

    dispose();

    expect(revokeUrl.mock.calls).toEqual([['blob:first.png'], ['blob:second.png']]);
  });

  it('revokes every URL when all attachments are cleared', () => {
    const [attachments, setAttachments] = solid.createSignal([
      new File(['image'], 'photo.png'),
    ]);
    setup(attachments);

    setAttachments([]);
    readAttachments();

    expect(revokeUrl.mock.calls).toEqual([['blob:photo.png']]);
    dispose();
    expect(revokeUrl).toHaveBeenCalledTimes(1);
  });
});
