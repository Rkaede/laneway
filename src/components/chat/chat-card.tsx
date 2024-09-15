import type { ComponentProps, ParentComponent } from 'solid-js';
import { For, splitProps } from 'solid-js';

import { cn } from '~/util';

import type { TagProps } from '../ui/tag';
import { Tag } from '../ui/tag';

type ChatCardProps = ComponentProps<'button'> & {
  title?: string;
  subtitle?: string;
  tags?: Array<string>;
  onClick?: () => void;
};

const tagMap: Record<string, TagProps['variant']> = {
  Preset: 'blue',
  Model: 'green',
  Assistant: 'purple',
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
        'flex w-56 flex-col gap-2 rounded-xl border bg-transparent p-4 text-sm text-card-foreground shadow',
        local.class,
      )}
      onClick={() => local.onClick?.()}
      {...rest}
    >
      <div>{local.title}</div>
      {local.subtitle && <div class="text-xs text-muted-foreground">{local.subtitle}</div>}
      <For each={local.tags}>
        {(tag) => <Tag variant={tagMap[tag] || 'default'}>{tag}</Tag>}
      </For>
      <div>{local.children}</div>
    </button>
  );
};
