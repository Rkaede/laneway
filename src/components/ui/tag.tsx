import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, JSX, ParentComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import { IconGlobe, IconSquarePen } from '../icons/ui';

const tagVariants = cva(
  'inline-flex items-center rounded-full px-2 py-[1px] text-xs font-medium gap-1',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-input bg-background',
        blue: 'bg-blue-100 text-blue-950',
        preset: 'bg-blue-300 text-blue-900',
        green: 'bg-green-200 text-green-950',
        model: 'bg-green-300 text-green-900',
        red: 'bg-red-300 text-red-900',
        warning: 'bg-yellow-300 text-yellow-900',
        note: 'bg-gray-100 text-gray-900',
        purple: 'bg-purple-200 text-purple-950',
        assistant: 'bg-purple-200 text-purple-900',
        vision: 'bg-blue-300 text-blue-900',
        new: 'bg-green-300 text-green-900',
        free: 'bg-amber-300 text-amber-900',
        online: 'bg-teal-100 text-teal-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type TagProps = ComponentProps<'span'> &
  VariantProps<typeof tagVariants> & {
    icon?: JSX.Element;
  };

export const Tag: ParentComponent<TagProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'variant', 'children', 'icon']);

  const defaultIcon = () => {
    if (local.variant === 'note') return <IconSquarePen class="size-3" stroke-width={2} />;
    if (local.variant === 'online') return <IconGlobe class="size-3" stroke-width={2} />;
    return null;
  };

  return (
    <span class={tagVariants({ variant: local.variant, class: local.class })} {...rest}>
      <Show when={local.icon || defaultIcon()}>{local.icon || defaultIcon()}</Show>
      {local.children}
    </span>
  );
};
