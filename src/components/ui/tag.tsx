import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, JSX, ParentComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import { IconGlobe, IconSquarePen } from '../icons/ui';
import { roleColorVariants } from './role-colors';

const colorVariants = roleColorVariants('background', 'text');

const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-tag px-2 py-[1px] text-xs font-medium',
  {
    variants: {
      variant: {
        ...colorVariants,
        default: 'bg-brand text-brand-fg',
        secondary: 'bg-surface-sunken text-main',
        outline: 'border border-border-emphasis bg-surface-raised',
        blue: colorVariants.online,
        green: colorVariants.free,
        red: 'bg-danger-subtle text-danger-subtle-fg',
        warning: colorVariants.new,
        note: 'bg-quiet-subtle text-quiet-subtle-fg',
        purple: colorVariants.vision,
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
