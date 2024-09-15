import { cva,type VariantProps } from 'class-variance-authority';
import { type JSX, type ParentComponent, Show } from 'solid-js';

import { cn } from '~/util';

export const SidebarGroup: ParentComponent<SidebarGroupProps> = (props) => {
  return (
    <div class="pb-4">
      <div class="px-4 py-1 pb-4 text-sm font-semibold text-stone-500">{props.title}</div>
      {props.children}
    </div>
  );
};

export const SidebarItems: ParentComponent<{ class?: string }> = (props) => {
  return <ul class={cn('flex flex-col gap-[1px] px-2', props.class)}>{props.children}</ul>;
};

export const SidebarLinkItem: ParentComponent<SidebarLinkItemProps> = (props) => {
  return (
    <a
      href={props.href}
      class={cn(
        'group flex items-center gap-1 rounded-lg border border-transparent px-2 py-0.5 hover:bg-background-2',
        props.active && 'bg-background-2 hover:bg-background-3',
        props.class,
      )}
    >
      <div class="flex flex-1 items-center gap-1 text-sm">
        <span>{props.icon}</span>
        <span class="truncate">{props.children}</span>
      </div>
      <Show when={props.dropdown}>
        <div class="flex h-6 flex-shrink-0 items-center">{props.dropdown}</div>
      </Show>
    </a>
  );
};

const sidebarItem = cva(
  'group flex cursor-pointer items-center rounded-lg border border-transparent text-sm',
  {
    variants: {
      active: {
        true: 'bg-background-2 hover:bg-background-3',
        false: 'hover:bg-background-3',
      },
      size: {
        md: 'py-0.5 px-2 gap-1',
        lg: 'py-2 px-3 gap-2',
      },
    },
    defaultVariants: {
      active: false,
      size: 'md',
    },
  },
);

export const SidebarItem: ParentComponent<SidebarItemProps> = (props) => {
  return (
    <li class={sidebarItem({ active: props.active, class: props.class, size: props.size })}>
      <button onClick={() => props.onClick()} class="flex w-full items-center" type="button">
        <span>{props.icon}</span>
        <span class="flex-1 truncate">{props.children}</span>
        <Show when={props.dropdown}>
          <div class="flex h-6 flex-shrink-0 items-center">{props.dropdown}</div>
        </Show>
      </button>
    </li>
  );
};

export type SidebarItemProps = VariantProps<typeof sidebarItem> & {
  active?: boolean;
  class?: string;
  icon?: JSX.Element;
  dropdown?: JSX.Element;
  onClick: () => void;
};

export type SidebarLinkItemProps = {
  active?: boolean;
  href: string;
  sessionId?: string;
  class?: string;
  icon?: JSX.Element;
  dropdown?: JSX.Element;
};

export type SidebarGroupProps = {
  title: string;
};
