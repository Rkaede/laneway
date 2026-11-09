import { createEffect, createSignal, ParentComponent, Show } from 'solid-js';

import { highlightCode } from './code-highlighting';

type CodeHighlighterProps = {
  code: string;
  language: string;
};

export const CodeHighlighter: ParentComponent<CodeHighlighterProps> = (props) => {
  // Unset until Shiki has highlighted the code, and again when highlighting fails. The code
  // then shows as plain text.
  const [html, setHtml] = createSignal<string>();
  let latestRequest = 0;

  createEffect(() => {
    // The code changes on every streamed word, so a result is dropped once a newer request
    // exists.
    const request = ++latestRequest;
    highlightCode(props.code, props.language)
      .then((result) => {
        if (request === latestRequest) setHtml(result);
      })
      .catch((error) => {
        if (request !== latestRequest) return;
        console.error('Failed to highlight code', error);
        setHtml(undefined);
      });
  });

  return (
    <div class="not-prose">
      <Show
        when={html()}
        fallback={
          <div data-language={props.language}>
            {/* Styled like Shiki's <pre>, so the block does not shift when it loads. */}
            <pre
              class="shiki"
              style={{
                'background-color': 'var(--shiki-background)',
                color: 'var(--shiki-foreground)',
              }}
              tabindex="0"
            >
              <code>{props.code}</code>
            </pre>
          </div>
        }
      >
        {/* oxlint-disable-next-line solid/no-innerhtml -- Shiki generates and escapes this markup. */}
        <div innerHTML={html()} data-language={props.language} />
      </Show>
      <div>{props.children}</div>
    </div>
  );
};
