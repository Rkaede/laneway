import remarkGfm from 'remark-gfm';
import { type Component, createMemo, Show } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { CodeBlock } from '~/components/ui';
import { cn } from '~/util';

import { rehypeStreamCursor, type StreamCursorShape } from './markdown-cursor';
import { sanitizeMarkdownLink } from './markdown-links';
import { rehypeWordSpans } from './markdown-words';

type MarkdownProps = {
  text: string;
  /** Puts each word in its own span, so a streaming answer can animate them one by one. */
  wordSpans?: boolean;
  /** Shows a cursor after the last text, for an answer that is still streaming. */
  cursor?: StreamCursorShape;
};

const Markdown: Component<MarkdownProps> = (props) => {
  const rehypePlugins = createMemo(() => [
    ...(props.wordSpans ? [rehypeWordSpans] : []),
    // The cursor is added last, so that it is not taken for a word.
    ...(props.cursor
      ? [[rehypeStreamCursor, props.cursor] as [typeof rehypeStreamCursor, StreamCursorShape]]
      : []),
  ]);

  return (
    <SolidMarkdown
      renderingStrategy="reconcile"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins()}
      transformLinkUri={sanitizeMarkdownLink}
      linkTarget={(href) => (/^(https?:|\/\/)/i.test(href) ? '_blank' : undefined)}
      components={{
        a(linkProps) {
          return (
            <Show when={linkProps.href} fallback={<span>{linkProps.children}</span>}>
              <a
                href={linkProps.href}
                title={linkProps.title}
                target={linkProps.target}
                rel={linkProps.target === '_blank' ? 'noopener noreferrer' : undefined}
              >
                {linkProps.children}
              </a>
            </Show>
          );
        },
        img(imageProps) {
          return <span>{imageProps.alt}</span>;
        },
        pre(preProps) {
          return <pre class="not-prose overflow-hidden rounded-card">{preProps.children}</pre>;
        },
        code(codeProps) {
          return (
            <Show
              when={codeProps.inline === true}
              fallback={
                <CodeBlock
                  code={
                    /* @ts-ignore: this is a dependency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                  language={codeProps.class?.replace(/^language-/, '') ?? 'plaintext'}
                />
              }
            >
              {/* Inline code counts as one word when a streaming answer animates its words. */}
              <span data-word class="inline-block max-w-full overflow-x-auto align-bottom">
                <span class="mx-[0.2em] inline-block rounded-tag border bg-surface-sunken px-1 align-baseline font-mono text-sm">
                  {
                    /* @ts-ignore: this is a dependency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                </span>
              </span>
            </Show>
          );
        },
      }}
      class={cn(
        'prose prose-p:leading-relaxed',
        // Keep list items close together, including loose lists where each item wraps a paragraph.
        'prose-ol:my-3 prose-ul:my-3 prose-li:my-0.5 prose-li:leading-relaxed [&_li>p]:my-0',
        // Typography's default palette is cleared by Loom, so point the prose vars at theme tokens.
        '[--tw-prose-body:var(--main)] [--tw-prose-bold:var(--main)] [--tw-prose-bullets:var(--faint)] [--tw-prose-captions:var(--muted)] [--tw-prose-code:var(--main)] [--tw-prose-counters:var(--muted)] [--tw-prose-headings:var(--main)] [--tw-prose-hr:var(--border)] [--tw-prose-kbd:var(--main)] [--tw-prose-lead:var(--muted)] [--tw-prose-links:var(--link)] [--tw-prose-quote-borders:var(--border-emphasis)] [--tw-prose-quotes:var(--main)] [--tw-prose-td-borders:var(--border)] [--tw-prose-th-borders:var(--border-emphasis)]',
      )}
    >
      {props.text}
    </SolidMarkdown>
  );
};

export default Markdown;
