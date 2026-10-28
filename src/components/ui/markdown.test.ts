import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

// Bun doesn't compile Solid JSX. Compile this component for SSR and stub the code-block UI.
const source = (await Bun.file(new URL('./markdown.tsx', import.meta.url)).text()).replace(
  "import { CodeBlock } from '~/components/ui';",
  'const CodeBlock = (props) => props.code;',
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile Markdown');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name.startsWith('~/')
    ? new URL(`../../${name.slice(2)}`, import.meta.url).href
    : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-markdown-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'markdown.mjs');
await Bun.write(filename, code);
const { default: Markdown }: { default: Component<{ text: string }> } = await import(filename);
const render = (text: string) => renderToString(() => Markdown({ text }));

describe('Markdown', () => {
  it('preserves arrows and generics in inline code without double escaping', () => {
    const html = render('`x => y` and `Vec<T>`');

    expect(html).toContain('>x => y</span>');
    expect(html).toContain('>Vec&lt;T></span>');
    expect(html).not.toContain('&amp;gt;');
    expect(html).not.toContain('&amp;lt;');
  });

  it('renders blockquotes', () => {
    const html = render('> A quote');

    expect(html).toContain('<blockquote');
    expect(html).toContain('>A quote</p>');
  });

  it('preserves literal entities in inline code', () => {
    expect(render('`&lt;T&gt;`')).toContain('>&amp;lt;T&amp;gt;</span>');
  });

  it('passes fenced code to CodeBlock without altering angle brackets or literal entities', () => {
    const html = render('```ts\nx => y\nVec<T>\n&lt;T&gt;\n```');

    expect(html).toContain('x => y\nVec&lt;T>\n&amp;lt;T&amp;gt;\n</pre>');
  });

  it('keeps raw HTML inert', () => {
    const html = render('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">');

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror');
  });

  it.each([
    ['[docs](https://example.com/guide)', 'https://example.com/guide'],
    ['[docs](http://example.com/guide)', 'http://example.com/guide'],
    ['[docs](HTTPS://example.com/guide)', 'HTTPS://example.com/guide'],
    ['[docs](//example.com/guide)', '//example.com/guide'],
    ['https://example.com/guide', 'https://example.com/guide'],
    ['[docs][guide]\n\n[guide]: https://example.com/guide', 'https://example.com/guide'],
  ])('opens web links separately with opener and referrer protection: %s', (text, href) => {
    const link = render(text).match(/<a\b[^>]*>/)?.[0];

    expect(link).toContain(`href="${href}"`);
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
  });

  it.each([
    ['[email](mailto:hello@example.com)', 'mailto:hello@example.com'],
    ['[phone](tel:+61312345678)', 'tel:+61312345678'],
    ['[docs](/guide)', '/guide'],
    ['[heading](#heading)', '#heading'],
  ])('leaves non-web links without a target: %s', (text, href) => {
    const link = render(text).match(/<a\b[^>]*>/)?.[0];

    expect(link).toContain(`href="${href}"`);
    expect(link).not.toContain('target=');
    expect(link).not.toContain('rel=');
  });

  it('keeps unsafe links and remote images blocked', () => {
    const html = render(
      '[unsafe](javascript:alert%281%29) ![alt text](https://example.com/image.png)',
    );

    expect(html).toContain('<span>unsafe</span>');
    expect(html).toContain('<span>alt text</span>');
    expect(html).not.toContain('href=');
    expect(html).not.toContain('<img');
  });
});
