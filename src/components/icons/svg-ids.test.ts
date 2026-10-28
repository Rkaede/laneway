import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { SVGAttributes } from '~/types';

const directory = await mkdtemp(join(tmpdir(), 'laneway-svg-ids-'));
afterAll(() => rm(directory, { recursive: true, force: true }));

// Bun doesn't compile Solid JSX, so render the real icon components through SSR.
async function loadIcons(
  name: 'creators' | 'models',
): Promise<Record<string, Component<SVGAttributes>>> {
  const source = await Bun.file(new URL(`./${name}.tsx`, import.meta.url)).text();
  const jsx = transpileModule(source, {
    compilerOptions: {
      jsx: JsxEmit.Preserve,
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
    },
  }).outputText;
  const compiled = transformSync(jsx, {
    presets: [['babel-preset-solid', { generate: 'ssr' }]],
  });
  if (!compiled?.code) throw new Error(`Failed to compile ${name} icons`);
  const code = compiled.code.replace(
    /from (['"])([^'"]+)\1/g,
    (_match, quote, specifier: string) => {
      return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
    },
  );
  const filename = join(directory, `${name}.mjs`);
  await Bun.write(filename, code);
  return import(filename);
}

const icons = { ...(await loadIcons('creators')), ...(await loadIcons('models')) };

describe('SVG icon IDs', () => {
  it('keeps IDs unique and references local across repeated model and creator icons', () => {
    const html = renderToString(() =>
      Object.values(icons).flatMap((Icon) => [Icon({}), Icon({})]),
    );
    const svgs = [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map(([svg]) => svg);
    expect(svgs).toHaveLength(Object.keys(icons).length * 2);

    const allIds = svgs.flatMap((svg) =>
      [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]),
    );
    expect(new Set(allIds).size).toBe(allIds.length);

    for (const svg of svgs) {
      const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
      const references = [...svg.matchAll(/url\(#([^)]+)\)|\bhref="#([^"]+)"/g)].map(
        (match) => match[1] ?? match[2],
      );
      for (const reference of references) {
        expect(ids).toContain(reference);
      }
    }
  });
});
