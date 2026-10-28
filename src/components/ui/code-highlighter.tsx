import { createEffect, createSignal, ParentComponent } from 'solid-js';

import { highlightCode } from './code-highlighting';

type CodeHighlighterProps = {
  code: string;
  language: string;
};

export const CodeHighlighter: ParentComponent<CodeHighlighterProps> = (props) => {
  const [html, setHtml] = createSignal('<div></div>');
  createEffect(() => {
    highlightCode(props.code, props.language).then(setHtml);
  });

  return (
    <div class="not-prose">
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <div innerHTML={html()} data-language={props.language} />
      <div>{props.children}</div>
    </div>
  );
};
