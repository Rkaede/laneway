import type { ParentComponent } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { cn } from '~/util';

type MarkdownProps = {
  children: string;
  class?: string;
};

export const Markdown: ParentComponent<MarkdownProps> = (props) => {
  return (
    <div
      class={cn(
        'prose prose-invert prose-p:leading-relaxed prose-pre:m-0 prose-pre:rounded-none prose-pre:p-0 prose-pre:leading-snug',
        props.class,
      )}
    >
      <SolidMarkdown>{props.children}</SolidMarkdown>
    </div>
  );
};
