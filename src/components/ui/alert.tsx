import type { AlertRootProps } from '@kobalte/core/alert';
import { Alert as AlertPrimitive } from '@kobalte/core/alert';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ComponentProps, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&:has(svg)]:pl-11 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground bg-background',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-red-300 dark:border-red-300 [&>svg]:text-red-300',
        warning: 'border-yellow-200 dark:border-yellow-200 [&>svg]:text-yellow-200',
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

  return <div class={cn('font-medium leading-5 tracking-tight', local.class)} {...rest} />;
};

export const AlertDescription = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <div class={cn('text-sm [&_p]:leading-relaxed', local.class)} {...rest} />;
};
