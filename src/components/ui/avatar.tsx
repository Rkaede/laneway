import { cva, type VariantProps } from 'class-variance-authority';
import type { JSX, ParentComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import { cn } from '~/util';

import { ModelIcon } from '../connected';

const avatarVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-raised select-none',
  {
    variants: {
      variant: {
        primary: 'shadow-xs',
        flat: 'shadow-none',
        light: 'bg-surface-raised text-main',
      },
      size: {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type AvatarProps = Partial<JSX.HTMLAttributes<HTMLDivElement>> &
  VariantProps<typeof avatarVariants> & {
    modelId?: string;
  };

export const Avatar: ParentComponent<AvatarProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'variant', 'size']);

  return (
    <div
      class={cn(avatarVariants({ variant: local.variant, size: local.size }), local.class)}
      {...rest}
    >
      <Show when={props.modelId} fallback={props.children}>
        <ModelIcon
          class={cn('size-4', {
            'size-3': local.size === 'sm',
            'size-5': local.size === 'md',
            'size-6': local.size === 'lg',
          })}
          modelId={props.modelId}
        />
      </Show>
    </div>
  );
};
