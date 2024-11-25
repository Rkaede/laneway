import { createHighlighter } from 'shiki';
import { createEffect, createSignal } from 'solid-js';

type CodeHighlighterProps = {
  code: string;
  language: string;
};

const languages = [
  'c',
  'cpp',
  'csharp',
  'css',
  'csv',
  'go',
  'haskell',
  'html',
  'java',
  'javascript',
  'jsx',
  'kotlin',
  'lua',
  'objective-c',
  'php',
  'python',
  'ruby',
  'rs',
  'scala',
  'shellscript',
  'sh',
  'sql',
  'swift',
  'typescript',
];

const languagesWithAliases = languages.concat([
  'c++', // cpp
  'cs', // csharp
  'c#', // csharp
  'hs', // haskell
  'js', // javascript
  'kt', // kotlin
  'kts', // kotlin
  'objc', // objective-c
  'py', // python
  'rb', // ruby
  'bash', // shellscript
  'sh', // shellscript
  'shell', // shellscript
  'zsh', // shellscript
  'ts', // typescript
]);

const highlighter = createHighlighter({
  themes: ['poimandres'],
  langs: languages,
});

export const CodeHighlighter = (props: CodeHighlighterProps) => {
  const [html, setHtml] = createSignal('<div></div>');
  createEffect(() => {
    // todo: find what the best way to do this
    // eslint-disable-next-line solid/reactivity
    highlighter.then((h) => {
      const highlightedCode = h.codeToHtml(props.code, {
        lang: languagesWithAliases.includes(props.language) ? props.language : 'text',
        theme: 'poimandres',
      });
      setHtml(highlightedCode);
    });
  });

  return (
    // eslint-disable-next-line solid/no-innerhtml
    <div class="not-prose" innerHTML={html()} data-language={props.language} />
  );
};
