import type { ComponentProps, ParentComponent } from 'solid-js';
import { For, splitProps } from 'solid-js';

import { IconChat, IconSquarePen } from '~/components/icons/ui';
import { Tag, type TagProps } from '~/components/ui/tag';
import { cn } from '~/util';

type ChatCardProps = ComponentProps<'button'> & {
  title?: string;
  subtitle?: string;
  tags?: Array<string>;
  sessionType?: 'note' | 'chat';
  onClick?: () => void;
};

const tagMap: Record<string, TagProps['variant']> = {
  preset: 'blue',
  model: 'green',
  assistant: 'purple',
};

export const ChatCard: ParentComponent<ChatCardProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'class',
    'title',
    'subtitle',
    'tags',
    'children',
    'onClick',
  ]);

  return (
    <button
      class={cn(
        'flex max-w-60 flex-col gap-3 rounded-xl border border-input bg-background-main p-4 text-left text-sm text-card-foreground shadow-sm transition-colors duration-100 hover:bg-background',
        local.class,
      )}
      onClick={() => local.onClick?.()}
      {...rest}
    >
      <div>
        <div class="flex items-center gap-1">
          {props.sessionType === 'note' && <IconSquarePen class="size-3" stroke-width={2} />}
          {props.sessionType === 'chat' && <IconChat class="size-3" stroke-width={2} />}
          <div>{local.title}</div>
        </div>
        {local.subtitle && <div class="text-xs text-muted-foreground">{local.subtitle}</div>}
      </div>
      <div class="flex gap-1">
        <For each={local.tags}>
          {(tag) => (
            <Tag variant={tagMap[tag] || 'default'}>
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </Tag>
          )}
        </For>
      </div>
    </button>
  );
};
