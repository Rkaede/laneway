import type { ComponentProps, ParentComponent } from 'solid-js';
import { For, Show, splitProps } from 'solid-js';

import { Tag, type TagProps } from '~/components/ui/tag';
import { selectModelById } from '~/store/selectors';
import { cn } from '~/util';

import { AvatarGroup } from '../ui';
import { ModelCard } from './model-card';
import { ModelIcon } from './model-icon';

type ChatCardProps = ComponentProps<'button'> & {
  title?: string;
  subtitle?: string;
  tags?: Array<string>;
  sessionType?: 'note' | 'chat';
  onClick?: () => void;
  models?: Array<string>;
  online?: boolean;
  showSubtitle?: boolean;
};

const tagMap: Record<string, TagProps['variant']> = {
  preset: 'blue',
  model: 'green',
  assistant: 'purple',
  online: 'online',
  note: 'note',
  free: 'free',
};

export const SpeedDialOption: ParentComponent<ChatCardProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'class',
    'title',
    'subtitle',
    'tags',
    'children',
    'onClick',
    'online',
    'models',
    'sessionType',
    'showSubtitle',
  ]);

  return (
    <button
      class={cn(
        'relative flex max-w-60 flex-col justify-between gap-3 rounded-2xl border border-input bg-background-main p-3 text-left text-sm text-card-foreground shadow-sm',
        'group hover:border-foreground/30 hover:bg-background',
        local.class,
      )}
      onClick={() => local.onClick?.()}
      {...rest}
    >
      <div class="w-full">
        <div class="flex items-center gap-1">
          <div class="flex flex-1 items-center gap-1 overflow-hidden truncate font-medium">
            {local.title}
          </div>
          <div class="">
            <Show when={local.models}>
              <AvatarGroup>
                <For each={local.models}>
                  {/* {(modelId) => <Avatar modelId={modelId} size="sm" variant="flat" />} */}
                  {(modelId) => {
                    const model = selectModelById(modelId)();
                    return (
                      <ModelCard model={model} class="size-4" variant="light">
                        <ModelIcon modelId={modelId} class="size-4" />
                      </ModelCard>
                    );
                  }}
                </For>
              </AvatarGroup>
            </Show>
          </div>
        </div>
        <Show when={local.showSubtitle}>
          {local.subtitle && (
            <div class="mt-1 text-xs text-muted-foreground">{local.subtitle}</div>
          )}
        </Show>
      </div>
      <div class="flex w-full items-end justify-between gap-2">
        <div class="flex flex-1 items-center gap-1">
          <For each={local.tags}>
            {(tag) => (
              <Tag variant={tagMap[tag] || 'default'}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </Tag>
            )}
          </For>
        </div>
      </div>
    </button>
  );
};
