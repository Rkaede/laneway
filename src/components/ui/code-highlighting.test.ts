import { describe, expect, it } from 'bun:test';

import { highlightCode } from './code-highlighting';

describe('highlightCode', () => {
  it.each([
    ['c', 'int main() { return 0; }'],
    ['cpp', 'int main() { return 0; }'],
    ['csharp', 'public class Example { int value = 1; }'],
    ['css', 'body { color: red; }'],
    ['diff', '-const value = 1;\n+const value = 2;'],
    ['dockerfile', 'FROM node:22'],
    ['go', 'package main\nfunc main() {}'],
    ['html', '<div class="example">Hello</div>'],
    ['java', 'public class Example { int value = 1; }'],
    ['javascript', 'const value = 1;'],
    ['json', '{"value": 1}'],
    ['jsx', 'const element = <div>Hello</div>;'],
    ['kotlin', 'val value: Int = 1'],
    ['lua', 'local value = 1'],
    ['markdown', '# Hello'],
    ['php', '<?php echo "Hello"; ?>'],
    ['powershell', '$value = "Hello"'],
    ['python', 'def greet():\n    return "Hello"'],
    ['r', 'value <- 1'],
    ['ruby', 'def greet\n  "Hello"\nend'],
    ['rust', 'fn main() { let value = 1; }'],
    ['shellscript', 'echo "Hello"'],
    ['sql', 'SELECT * FROM users;'],
    ['swift', 'let value: Int = 1'],
    ['toml', '[package]\nname = "laneway"'],
    ['tsx', 'const element: JSX.Element = <div>Hello</div>;'],
    ['typescript', 'const value: number = 1;'],
    ['yaml', 'value: true'],
  ])(
    'highlights %s with the JavaScript engine and CSS-variable theme',
    async (language, code) => {
      const html = await highlightCode(code, language);

      expect(html).toContain('class="shiki css-variables"');
      expect(html).toContain('<span style="');
      expect(html).not.toBe(await highlightCode(code, 'text'));
    },
  );

  it.each([
    ['c++', 'cpp'],
    ['cs', 'csharp'],
    ['c#', 'csharp'],
    ['js', 'javascript'],
    ['ts', 'typescript'],
    ['kt', 'kotlin'],
    ['kts', 'kotlin'],
    ['py', 'python'],
    ['rb', 'ruby'],
    ['rs', 'rust'],
    ['bash', 'shellscript'],
    ['sh', 'shellscript'],
    ['shell', 'shellscript'],
    ['zsh', 'shellscript'],
    ['yml', 'yaml'],
  ])('uses the bundled grammar for alias %s', async (alias, language) => {
    const code = 'value = "Hello"';

    expect(await highlightCode(code, alias)).toBe(await highlightCode(code, language));
  });

  it.each(['unknown-language', 'haskell', 'plaintext', 'text', ''])(
    'falls back to escaped plain text for %j',
    async (language) => {
      const code = '<script>alert("test")</script> & value';
      const html = await highlightCode(code, language);

      expect(html).toBe(await highlightCode(code, 'text'));
      expect(html).toContain('&#x3C;script>');
      expect(html).toContain('&#x26; value');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('--shiki-token-');
    },
  );
});
