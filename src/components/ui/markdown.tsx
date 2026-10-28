import remarkGfm from 'remark-gfm';
import { type Component, Show } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { CodeBlock } from '~/components/ui';
import { cn } from '~/util';

import { sanitizeMarkdownLink } from './markdown-links';

const Markdown: Component<{ text: string }> = (props) => {
  return (
    <SolidMarkdown
      renderingStrategy="reconcile"
      remarkPlugins={[remarkGfm]}
      transformLinkUri={sanitizeMarkdownLink}
      linkTarget={(href) => (/^(https?:|\/\/)/i.test(href) ? '_blank' : undefined)}
      components={{
        a(linkProps) {
          return (
            <Show when={linkProps.href} fallback={<span>{linkProps.children}</span>}>
              <a
                {...linkProps}
                rel={linkProps.target === '_blank' ? 'noopener noreferrer' : undefined}
              />
            </Show>
          );
        },
        img(imageProps) {
          return <span>{imageProps.alt}</span>;
        },
        pre(preProps) {
          return <pre class="not-prose overflow-hidden rounded-card" {...preProps} />;
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
                  language={codeProps.class?.replace(/^language-/, '') ?? 'plaintext'}
                  {...codeProps}
                />
              }
            >
              <span class="inline-block max-w-full overflow-x-auto align-bottom">
                <span class="mx-[0.2em] inline-block rounded-tag border bg-surface-sunken px-1 align-baseline font-mono text-sm">
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
        'prose prose-p:leading-relaxed prose-pre:m-0 prose-pre:rounded-none prose-pre:p-0 prose-pre:leading-snug',
        // Keep list items close together, including loose lists where each item wraps a paragraph.
        'prose-ol:my-3 prose-ul:my-3 prose-li:my-0.5 prose-li:leading-relaxed [&_li>p]:my-0',
        // Typography's default palette is cleared by Loom, so point the prose vars at theme tokens.
        '[--tw-prose-body:var(--main)] [--tw-prose-bold:var(--main)] [--tw-prose-bullets:var(--faint)] [--tw-prose-captions:var(--muted)] [--tw-prose-code:var(--main)] [--tw-prose-counters:var(--muted)] [--tw-prose-headings:var(--main)] [--tw-prose-hr:var(--border)] [--tw-prose-kbd:var(--main)] [--tw-prose-lead:var(--muted)] [--tw-prose-links:var(--link)] [--tw-prose-pre-bg:var(--surface-sunken)] [--tw-prose-pre-code:var(--main)] [--tw-prose-quote-borders:var(--border-emphasis)] [--tw-prose-quotes:var(--main)] [--tw-prose-td-borders:var(--border)] [--tw-prose-th-borders:var(--border-emphasis)]',
      )}
    >
      {props.text}
    </SolidMarkdown>
  );
};

export default Markdown;
