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
        'flex max-w-60 flex-col gap-2 rounded-xl border border-input bg-background-main p-4 text-left text-sm text-card-foreground shadow transition-colors duration-100 hover:bg-background',
        local.class,
      )}
      onClick={() => local.onClick?.()}
      {...rest}
    >
      <div>
        <div>{local.title}</div>
        {local.subtitle && <div class="text-xs text-muted-foreground">{local.subtitle}</div>}
      </div>
      <div>
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
