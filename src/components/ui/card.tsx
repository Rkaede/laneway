import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const cardVariants = cva('rounded-card border bg-surface-raised text-main shadow-sm', {
  variants: {
    variant: {
      default: '',
      solid: 'hover:border-border-emphasis',
    },
    button: {
      true: 'cursor-pointer',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface CardProps extends ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

export function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  return (
    <div
      role={props.onClick ? 'button' : undefined}
      class={cn(cardVariants({ variant: local.variant, button: !!props.onClick }), local.class)}
      {...rest}
    />
  );
}

export const CardHeader = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('flex flex-col space-y-1.5 p-6', local.class)} {...rest} />;
};

export const CardTitle: ParentComponent<ComponentProps<'h1'>> = (props) => {
  const [local, rest] = splitProps(props, ['class']);

  return <h1 class={cn('leading-none font-semibold tracking-tight', local.class)} {...rest} />;
};

export const CardContent = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('p-6 pt-0', local.class)} {...rest} />;
};
