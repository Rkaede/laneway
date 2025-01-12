import { For, type ParentComponent, Show } from 'solid-js';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';
import { ModelProps } from '~/types';

import { DollarSignIcon, MaximizeIcon } from '../icons/ui';
import { Price, Separator, Tag, Tokens } from '../ui';
import { ModelIcon } from './model-icon';

type ModelIconProps = {
  model?: ModelProps;
  class?: string;
};

export const ModelCard: ParentComponent<ModelIconProps> = (props) => {
  return (
    <HoverCard>
      <HoverCardTrigger href="#">
        <div class="rounded-full border border-transparent p-1 text-foreground hover:bg-muted">
          {props.children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent class="w-auto min-w-[280px] p-0">
        <Show when={props.model}>{(m) => <ModelCardContent model={m()} />}</Show>
      </HoverCardContent>
    </HoverCard>
  );
};

const ModelCardContent: ParentComponent<{ model: ModelProps }> = (props) => {
  return (
    <div class="grid w-full max-w-lg gap-4 p-4 text-sm">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-lg">
          <ModelIcon modelId={props.model.id} class="size-4" />
          <span>{props.model.creator.name}</span>
          <span>/</span>
          <span class="font-semibold">{props.model?.title}</span>
        </div>
        <div class="flex items-center gap-2">
          <For each={props.model.tags}>{(tag) => <Tag variant={tag}>{tag}</Tag>}</For>
        </div>
      </div>
      <Separator />
      <div class="grid gap-4">
        <div class="flex items-start gap-2">
          <MaximizeIcon class="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p class="text-sm font-semibold">Max Tokens</p>
            <div class="grid grid-cols-[auto_1fr] gap-x-2">
              <div>input: </div>
              <Tokens tokens={props.model.contextLength} class="text-muted-foreground" />
              <div>output: </div>
              <Tokens tokens={props.model.maxCompletionTokens} class="text-muted-foreground" />
            </div>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <DollarSignIcon class="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <p class="text-sm font-semibold">Pricing</p>
            <div class="grid grid-cols-[auto_1fr] gap-x-2">
              <div>input: </div>
              <Price pricing={props.model.pricing.prompt} class="text-muted-foreground" />
              <div>output: </div>
              <Price pricing={props.model.pricing.completion} class="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
      <Separator />

      <div class="text-right text-muted-foreground">
        Released:{' '}
        {new Date(props.model.created * 1000).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
        })}
      </div>
    </div>
  );
};
