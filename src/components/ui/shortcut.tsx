import { isMac } from '@solid-primitives/platform';
import { cva, type VariantProps } from 'class-variance-authority';
import type { Component, ComponentProps } from 'solid-js';
import { splitProps } from 'solid-js';

const shortcutVariants = cva('ml-auto text-xs font-medium text-muted', {
  variants: {
    variant: {
      default: '',
      ghost: 'bg-transparent hover:bg-surface-hover hover:text-main',
      solid: 'rounded-tag bg-surface-sunken px-1 py-0.5 font-semibold text-muted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type ShortcutProps = ComponentProps<'span'> & VariantProps<typeof shortcutVariants>;

export const Shortcut: Component<ShortcutProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children', 'variant']);

  function formattedShortcut() {
    if (typeof local.children === 'string') {
      return local.children.replace(/\$mod/g, isMac ? '⌘' : 'Ctrl');
    }
    return local.children;
  }

  return (
    <span class={shortcutVariants({ variant: local.variant, class: local.class })} {...rest}>
      {formattedShortcut()}
    </span>
  );
};
