import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type {
  TabsContentProps,
  TabsIndicatorProps,
  TabsListProps,
  TabsRootProps,
  TabsTriggerProps,
} from '@kobalte/core/tabs';
import { Tabs as TabsPrimitive } from '@kobalte/core/tabs';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { ValidComponent, VoidProps } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

type tabsProps<T extends ValidComponent = 'div'> = TabsRootProps<T> & {
  class?: string;
};

export const Tabs = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, tabsProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsProps, ['class']);

  return (
    <TabsPrimitive
      class={cn('w-full data-[orientation=vertical]:flex', local.class)}
      {...rest}
    />
  );
};

type tabsListProps<T extends ValidComponent = 'div'> = TabsListProps<T> & {
  class?: string;
};

export const TabsList = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, tabsListProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsListProps, ['class']);

  return (
    <TabsPrimitive.List
      class={cn(
        'relative flex w-full rounded-md bg-surface-sunken p-1 text-muted data-[orientation=horizontal]:items-center data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
        local.class,
      )}
      {...rest}
    />
  );
};

type tabsContentProps<T extends ValidComponent = 'div'> = TabsContentProps<T> & {
  class?: string;
};

export const TabsContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, tabsContentProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsContentProps, ['class']);

  return (
    <TabsPrimitive.Content
      class={cn(
        'transition-shadow duration-200 focus-visible:ring-[3px] focus-visible:ring-border-focus/50 focus-visible:outline-hidden data-[orientation=horizontal]:mt-2 data-[orientation=vertical]:ml-2',
        local.class,
      )}
      {...rest}
    />
  );
};

type tabsTriggerProps<T extends ValidComponent = 'button'> = TabsTriggerProps<T> & {
  class?: string;
};

export const TabsTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, tabsTriggerProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsTriggerProps, ['class']);

  return (
    <TabsPrimitive.Trigger
      class={cn(
        'peer relative z-10 inline-flex h-7 w-full items-center justify-center rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-main',
        local.class,
      )}
      {...rest}
    />
  );
};

const tabsIndicatorVariants = cva(
  'absolute outline-hidden transition-[transform,box-shadow] duration-200',
  {
    variants: {
      variant: {
        block:
          'rounded-sm bg-surface-raised shadow-xs peer-focus-visible:ring-[3px] peer-focus-visible:ring-border-focus/50 peer-focus-visible:outline-hidden data-[orientation=horizontal]:bottom-1 data-[orientation=horizontal]:left-0 data-[orientation=horizontal]:h-[calc(100%-0.5rem)] data-[orientation=vertical]:top-0 data-[orientation=vertical]:right-1 data-[orientation=vertical]:w-[calc(100%-0.5rem)]',
        underline:
          'bg-brand data-[orientation=horizontal]:-bottom-[1px] data-[orientation=horizontal]:left-0 data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:top-0 data-[orientation=vertical]:-right-[1px] data-[orientation=vertical]:w-[2px]',
      },
    },
    defaultVariants: {
      variant: 'block',
    },
  },
);

type tabsIndicatorProps<T extends ValidComponent = 'div'> = VoidProps<
  TabsIndicatorProps<T> &
    VariantProps<typeof tabsIndicatorVariants> & {
      class?: string;
    }
>;

export const TabsIndicator = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, tabsIndicatorProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsIndicatorProps, ['class', 'variant']);

  return (
    <TabsPrimitive.Indicator
      class={cn(tabsIndicatorVariants({ variant: local.variant }), local.class)}
      {...rest}
    />
  );
};
