import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, JSX, ParentComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

const tagVariants = cva(
  'inline-flex items-center rounded-full px-2 py-[1px] text-xs font-semibold gap-1',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        outline: 'border border-input bg-background',
        blue: 'bg-blue-300 text-blue-900',
        preset: 'bg-blue-300 text-blue-900',
        green: 'bg-green-300 text-green-900',
        model: 'bg-green-300 text-green-900',
        red: 'bg-red-300 text-red-900',
        warning: 'bg-yellow-300 text-yellow-900',
        note: 'bg-primary text-yellow-900',
        purple: 'bg-purple-300 text-purple-900',
        assistant: 'bg-purple-300 text-purple-900',
        Vision: 'bg-blue-300 text-blue-900',
        New: 'bg-green-300 text-green-900',
        Free: 'bg-amber-300 text-amber-900',
        Online: 'bg-fuchsia-300 text-fuchsia-900',
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

  return (
    <span class={tagVariants({ variant: local.variant, class: local.class })} {...rest}>
      <Show when={local.icon}>{local.icon}</Show>
      {local.children}
    </span>
  );
};
