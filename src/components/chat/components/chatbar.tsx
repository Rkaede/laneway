import { type Component, Show } from 'solid-js';

import { ModelCard, ModelIcon } from '~/components/connected';
import type { AssistantProps, ChatProps, ModelProps, Provider } from '~/types';
import { cn } from '~/util';

type ChatbarProps = {
  chat: ChatProps;
  assistant?: AssistantProps;
  model?: ModelProps;
  provider?: Provider;
  class?: string;
  type?: 'assistant' | 'model';
  sessionType?: 'chat' | 'note';
};

export const Chatbar: Component<ChatbarProps> = (props) => {
  return (
    <div
      class={cn(
        'fade-out-below border-l-none sticky top-0 z-10 flex h-11 justify-between border-b border-r bg-background-main p-2 px-4 group-first-of-type:border-l',
        props.class,
      )}
    >
      <div class="flex items-center gap-2">
        <ModelCard model={props.model} class="size-6">
          <ModelIcon modelId={props.model?.id} class="size-6" />
        </ModelCard>
        <div class="flex flex-col gap-[2px]">
          <div class="flex items-center gap-0.5 text-sm font-medium leading-none">
            <div>{props.assistant?.title ?? props.model?.title ?? 'Unknown'}</div>
          </div>
          <Show when={props.type === 'assistant' && props.assistant?.subtitle}>
            <div class="text-xs leading-none text-muted-foreground">
              {props.assistant?.subtitle}
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
