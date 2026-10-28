import type { ButtonRootProps } from '@kobalte/core/button';
import { Button as ButtonPrimitive } from '@kobalte/core/button';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const buttonVariants = cva('btn', {
  variants: {
    variant: {
      default: 'btn-primary',
      destructive: 'btn-danger',
      outline: 'btn-outline',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      bare: 'hover:bg-transparent',
      link: 'btn-link',
      combobox: 'btn-field w-full min-w-0 justify-between text-left font-normal',
      close: 'size-10 rounded-full p-0 text-on-media hover:bg-media-wash',
      toolbar: 'text-main hover:bg-surface-hover',
    },
    size: {
      default: 'btn-md',
      sm: 'btn-xs',
      lg: 'btn-lg',
      icon: 'btn-icon-sm',
      toolbar: 'size-7 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type buttonProps<T extends ValidComponent = 'button'> = ButtonRootProps<T> &
  VariantProps<typeof buttonVariants> & {
    class?: string;
  };

export const Button = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, buttonProps<T>>,
) => {
  const [local, rest] = splitProps(props as buttonProps, ['class', 'variant', 'size']);

  return (
    <ButtonPrimitive
      class={cn(buttonVariants({ size: local.size, variant: local.variant }), local.class)}
      {...rest}
    />
  );
};
