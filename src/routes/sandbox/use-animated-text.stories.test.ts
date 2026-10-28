import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, afterEach, expect, it, mock, spyOn } from 'bun:test';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import * as animatedText from '../../hooks/create-animated-text';

const directory = await mkdtemp(join(tmpdir(), 'laneway-animated-text-story-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
afterEach(() => mock.restore());

// Preserve event handlers in a plain element tree without needing a DOM.
const source = await Bun.file(
  new URL('./use-animated-text.stories.tsx', import.meta.url),
).text();
const compiled = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.React,
    jsxFactory: 'element',
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const code = compiled.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name.startsWith('~/')
    ? new URL(`../../${name.slice(2)}`, import.meta.url).href
    : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'use-animated-text.stories.mjs');
await Bun.write(
  filename,
  `const element = (tag, props, ...children) => ({ tag, props, children });\n${code}`,
);
const { Changing } = await import(filename);

it('appends text to the signal consumed by the animation on every click', () => {
  let readText: () => string = () => '';
  spyOn(animatedText, 'default').mockImplementation((text) => {
    readText = text;
    return { animatedText: text, isAnimating: () => false };
  });

  const story = Changing();
  const button = story.children.find((child: { tag: string }) => child.tag === 'button');
  const initialText = readText();
  expect(initialText).toBe('First message that appears...');

  button.props.onClick();
  expect(readText()).toBe(`${initialText}\n${initialText}`);

  button.props.onClick();
  expect(readText()).toBe(`${initialText}\n${initialText}\n${initialText}`);
});
