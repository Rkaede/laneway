import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const cardVariants = cva('rounded-xl border bg-card text-card-foreground shadow', {
  variants: {
    variant: {
      default: '',
      solid: 'hover:border-background-3',
    },
    button: {
      true: 'cursor-pointer',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface CardProps extends ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

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

  return <h1 class={cn('font-semibold leading-none tracking-tight', local.class)} {...rest} />;
};

export const CardDescription: ParentComponent<ComponentProps<'h3'>> = (props) => {
  const [local, rest] = splitProps(props, ['class']);

  return <h3 class={cn('text-sm text-muted-foreground', local.class)} {...rest} />;
};

export const CardContent = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('p-6 pt-0', local.class)} {...rest} />;
};

export const CardFooter = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('flex items-center p-6 pt-0', local.class)} {...rest} />;
};
