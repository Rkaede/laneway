import { getHighlighter } from 'shiki';
import { createEffect, createSignal } from 'solid-js';

type CodeHighlighterProps = {
  code: string;
  language: string;
};

const highlighter = getHighlighter({
  themes: ['poimandres'],
  langs: [
    'js',
    'jsx',
    'py',
    'java',
    'c',
    'cpp',
    'csv',
    'cpp',
    'cs',
    'rb',
    'php',
    'swift',
    'objc',
    'kt',
    'ts',
    'go',
    'rs',
    'scala',
    'hs',
    'lua',
    'sh',
    'sql',
    'html',
    'css',
  ],
});

export const CodeHighlighter = (props: CodeHighlighterProps) => {
  const [html, setHtml] = createSignal('<div></div>');
  createEffect(() => {
    // todo: find what the best way to do this
    // eslint-disable-next-line solid/reactivity
    highlighter.then((h) => {
      const highlightedCode = h.codeToHtml(props.code, {
        lang: props.language,
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
