import type { AlertRootProps } from '@kobalte/core/alert';
import { Alert as AlertPrimitive } from '@kobalte/core/alert';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const alertVariants = cva(
  'relative w-full rounded-card border px-4 py-3 text-sm [&:has(svg)]:pl-11 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg]:text-main [&>svg+div]:translate-y-[-3px]',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised text-main',
        destructive:
          'border-danger-border bg-danger-subtle text-danger-subtle-fg [&>svg]:text-danger-subtle-fg',
        warning:
          'border-warning-border bg-warning-subtle text-warning-subtle-fg [&>svg]:text-warning-subtle-fg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type alertProps<T extends ValidComponent = 'div'> = AlertRootProps<T> &
  VariantProps<typeof alertVariants> & {
    class?: string;
  };

export const Alert = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, alertProps<T>>,
) => {
  const [local, rest] = splitProps(props as alertProps, ['class', 'variant']);

  return (
    <AlertPrimitive
      class={cn(
        alertVariants({
          variant: props.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

export const AlertTitle = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('leading-5 font-medium tracking-tight', local.class)} {...rest} />;
};

export const AlertDescription = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('text-sm [&_p]:leading-relaxed', local.class)} {...rest} />;
};
