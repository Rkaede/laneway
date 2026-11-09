import { type Component, Show } from 'solid-js';

import { ModelCard } from '~/components/connected/model-card';
import { ModelIcon } from '~/components/connected/model-icon';
import type { AssistantProps, ModelProps } from '~/types';
import { cn } from '~/util';

type ChatbarProps = {
  assistant?: AssistantProps;
  model?: ModelProps;
  class?: string;
  type?: 'assistant' | 'model';
  isFirst?: boolean;
  isLast?: boolean;
};

export const Chatbar: Component<ChatbarProps> = (props) => {
  return (
    <div
      class={cn(
        'fade-out-below sticky top-0 z-10 flex h-11 justify-between border-r border-b border-border bg-surface p-2 px-4',
        'group-first-of-type:border-l',
        props.isFirst ? 'rounded-bl-md' : '',
        props.isLast ? 'rounded-br-md' : '',
        props.class,
      )}
    >
      <div class="flex items-center gap-2">
        <ModelCard model={props.model}>
          <ModelIcon modelId={props.model?.id} class="size-6" />
        </ModelCard>
        <div class="flex flex-col gap-[2px]">
          <div class="flex items-center gap-0.5 text-sm leading-none font-medium">
            <div>{props.assistant?.title ?? props.model?.title ?? 'Unknown'}</div>
          </div>
          <Show when={props.type === 'assistant' && props.assistant?.subtitle}>
            <div class="text-xs leading-none text-muted">{props.assistant?.subtitle}</div>
          </Show>
        </div>
      </div>
    </div>
  );
};
