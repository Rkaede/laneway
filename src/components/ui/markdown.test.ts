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
  'const CodeBlock = (props) => <code data-language={props.language}>{props.code}</code>;',
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
type MarkdownProps = { text: string; wordSpans?: boolean; cursor?: 'square' | 'circle' };
const { default: Markdown }: { default: Component<MarkdownProps> } = await import(filename);
const render = (text: string, options: Omit<MarkdownProps, 'text'> = {}) =>
  renderToString(() => Markdown({ text, ...options }));

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

    expect(html).toContain('x => y\nVec&lt;T>\n&amp;lt;T&amp;gt;\n</code></pre>');
  });

  it('renders fenced code without Markdown metadata on the pre element', () => {
    const html = render('```ts\nconst value = 1;\n```');
    const pre = html.match(/<pre\b[^>]*>/)?.[0];

    expect(pre).toMatch(/class="not-prose overflow-hidden rounded-card\s*"/);
    expect(pre).not.toMatch(/\s(node|key)=/);
    expect(html).toContain('<code data-language="ts">const value = 1;\n</code>');
  });

  it('keeps link titles without forwarding Markdown metadata', () => {
    const html = render('[docs](https://example.com/guide "Read the guide")');
    const link = html.match(/<a\b[^>]*>/)?.[0];

    expect(link).toContain('title="Read the guide"');
    expect(link).not.toMatch(/\s(node|key)=/);
    expect(html).toContain('>docs</a>');
  });

  it.each(['objective-c', 'unknown-language-with-hyphens', 'typescript', 'c++'])(
    'passes the complete fenced language to CodeBlock: %s',
    (language) => {
      expect(render(`\`\`\`${language}\ncode\n\`\`\``)).toContain(
        `<code data-language="${language}">code\n</code>`,
      );
    },
  );

  it('uses plaintext for code fences without a language', () => {
    expect(render('```\ncode\n```')).toContain('<code data-language="plaintext">code\n</code>');
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

  it('adds no spans or cursor to a finished answer', () => {
    const html = render('Two words');

    expect(html).not.toContain('data-word');
    expect(html).not.toContain('stream-cursor');
  });

  it('puts each word of a streaming answer in a span', () => {
    const html = render('Two **bold** words', { wordSpans: true });

    expect(html.match(/<span[^>]*data-word[^>]*>/g)).toHaveLength(3);
    expect(html).toContain('>bold</span></strong>');
  });

  it('puts the cursor after the last text of a streaming answer', () => {
    const html = render('First.\n\nSecond', { cursor: 'square' });

    expect(html).toMatch(/Second<span[^>]*class="stream-cursor[^>]*><\/span><\/p>/);
    expect(html).toContain('data-shape="square"');
    expect(html.match(/class="stream-cursor/g)).toHaveLength(1);
  });

  it('puts the cursor on a line below a code block', () => {
    const html = render('Run:\n\n```ts\nconst a = 1;\n```', { cursor: 'circle' });

    expect(html).toMatch(/<\/pre><div[^>]*class="stream-cursor-line/);
  });

  it('keeps the cursor out of the word spans', () => {
    const html = render('Two words', { wordSpans: true, cursor: 'square' });

    expect(html.match(/<span[^>]*data-word[^>]*>/g)).toHaveLength(2);
    expect(html).toMatch(/words<\/span><span[^>]*class="stream-cursor/);
  });
});
