import { type Component, Show } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { CodeBlock } from '~/components/ui';
import { cn, sanitizeMessage } from '~/util';

// type MarkdownProps = {
//   children: string;
//   class?: string;
// };

const Markdown: Component<{ text: string }> = (props) => {
  return (
    <SolidMarkdown
      components={{
        pre(preProps) {
          return <pre class="not-prose overflow-hidden rounded" {...preProps} />;
        },
        code(codeProps) {
          return (
            <Show
              when={codeProps.inline === true}
              fallback={
                <CodeBlock
                  code={
                    /* @ts-ignore: this is a depencency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                  language={codeProps.class?.split('-')[1] ?? 'plaintext'}
                  {...codeProps}
                />
              }
            >
              <span class="inline-block max-w-full overflow-x-auto align-bottom">
                <span class="mx-[0.2em] inline-block rounded border bg-background/80 px-1 align-baseline font-mono text-sm">
                  {
                    /* @ts-ignore: this is a depencency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                </span>
              </span>
            </Show>
          );
        },
      }}
      class={cn(
        'prose dark:prose-invert prose-p:leading-relaxed prose-pre:m-0 prose-pre:rounded-none prose-pre:p-0 prose-pre:leading-snug',
      )}
    >
      {sanitizeMessage(props.text)}
    </SolidMarkdown>
  );
};

export default Markdown;
