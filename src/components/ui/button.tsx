import type { ButtonRootProps } from '@kobalte/core/button';
import { Button as ButtonPrimitive } from '@kobalte/core/button';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground shadow hover:bg-accent/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-background-2  text-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-muted/90',
        bare: 'hover:bg-transparent',
        link: 'text-primary underline-offset-4 hover:underline',
        combobox:
          'border border-input shadow-sm hover:text-foreground bg-transparent text-left w-full items-center justify-between min-w-72',
        close:
          'hover:bg-muted/90 rounded-full text-white flex items-center justify-center size-10',
        toolbar: 'text-foreground hover:bg-muted/50',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        toolbar: 'h-7 w-7 rounded-full',
      },
    },
    compoundVariants: [
      {
        variant: 'close',
        size: 'default',
        class: 'text-white p-0 m-0',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

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
