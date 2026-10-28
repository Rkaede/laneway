import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, JSX, ParentComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import { IconGlobe, IconSquarePen } from '../icons/ui';

const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-tag px-2 py-[1px] text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-brand text-brand-fg',
        secondary: 'bg-surface-sunken text-main',
        outline: 'border border-border-emphasis bg-surface-raised',
        blue: 'bg-active-subtle text-active-subtle-fg',
        preset: 'bg-brand-subtle text-brand-subtle-fg',
        green: 'bg-success-subtle text-success-subtle-fg',
        model: 'bg-neutral-subtle text-neutral-subtle-fg',
        red: 'bg-danger-subtle text-danger-subtle-fg',
        warning: 'bg-warning-subtle text-warning-subtle-fg',
        note: 'bg-quiet-subtle text-quiet-subtle-fg',
        purple: 'bg-confirmed-subtle text-confirmed-subtle-fg',
        assistant: 'bg-important-subtle text-important-subtle-fg',
        vision: 'bg-confirmed-subtle text-confirmed-subtle-fg',
        new: 'bg-warning-subtle text-warning-subtle-fg',
        free: 'bg-success-subtle text-success-subtle-fg',
        online: 'bg-active-subtle text-active-subtle-fg',
        reasoning: 'bg-info-subtle text-info-subtle-fg',
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
