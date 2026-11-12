import { A } from '@solidjs/router';
import { type Component, Show } from 'solid-js';

import { IconSplit } from '~/components/icons/ui';

type BranchNoticeProps = {
  parentTitle: string;
  /** Link to the parent. Leave out when the parent has been deleted. */
  href?: string;
};

export const BranchNotice: Component<BranchNoticeProps> = (props) => {
  return (
    // Sits between messages, so lines either side set it apart from the conversation.
    <p class="flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden="true" class="h-px min-w-4 flex-1 bg-border" />
      <IconSplit class="size-3.5 shrink-0 -scale-y-100" />
      <span class="shrink-0">Forked from</span>
      <Show
        when={props.href}
        fallback={<span class="truncate">{props.parentTitle} (deleted)</span>}
      >
        {(href) => (
          <A href={href()} class="truncate text-main underline underline-offset-2">
            {props.parentTitle}
          </A>
        )}
      </Show>
      <span aria-hidden="true" class="h-px min-w-4 flex-1 bg-border" />
    </p>
  );
};
