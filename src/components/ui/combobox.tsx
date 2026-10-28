import * as ComboboxPrimitive from '@kobalte/core/combobox';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import { type JSX, splitProps, type ValidComponent } from 'solid-js';

import { cn } from '~/util';

const Combobox = ComboboxPrimitive.Root;
const ComboboxItemLabel = ComboboxPrimitive.ItemLabel;
const ComboboxHiddenSelect = ComboboxPrimitive.HiddenSelect;

type ComboboxItemProps<T extends ValidComponent = 'li'> =
  ComboboxPrimitive.ComboboxItemProps<T> & {
    class?: string | undefined;
  };

const ComboboxItem = <T extends ValidComponent = 'li'>(
  props: PolymorphicProps<T, ComboboxItemProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxItemProps, ['class']);
  return (
    <ComboboxPrimitive.Item
      class={cn(
        'relative flex cursor-default items-center justify-between rounded-sm px-2 py-1.5 text-sm font-menu outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-hover',
        local.class,
      )}
      {...others}
    />
  );
};

type ComboboxItemIndicatorProps<T extends ValidComponent = 'div'> =
  ComboboxPrimitive.ComboboxItemIndicatorProps<T> & {
    children?: JSX.Element;
  };

const ComboboxItemIndicator = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, ComboboxItemIndicatorProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxItemIndicatorProps, ['children']);
  return (
    <ComboboxPrimitive.ItemIndicator class="text-brand" {...others}>
      {local.children ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M5 12l5 5l10 -10" />
        </svg>
      )}
    </ComboboxPrimitive.ItemIndicator>
  );
};

type ComboboxSectionProps<T extends ValidComponent = 'li'> =
  ComboboxPrimitive.ComboboxSectionProps<T> & { class?: string | undefined };

const ComboboxSection = <T extends ValidComponent = 'li'>(
  props: PolymorphicProps<T, ComboboxSectionProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxSectionProps, ['class']);
  return (
    <ComboboxPrimitive.Section
      class={cn('overflow-hidden p-1 px-2 py-1.5 text-xs font-medium text-muted', local.class)}
      {...others}
    />
  );
};

type ComboboxControlProps<
  U,
  T extends ValidComponent = 'div',
> = ComboboxPrimitive.ComboboxControlProps<U, T> & {
  class?: string | undefined;
};

const ComboboxControl = <T, U extends ValidComponent = 'div'>(
  props: PolymorphicProps<U, ComboboxControlProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxControlProps<T>, ['class']);
  return (
    <ComboboxPrimitive.Control
      class={cn(
        'flex items-center rounded-md border border-border-emphasis bg-surface-input px-3 shadow-field focus-within:border-field-focus focus-within:ring-(length:--field-focus-ring-w) focus-within:ring-border-focus/50',
        local.class,
      )}
      {...others}
    />
  );
};

type ComboboxInputProps<T extends ValidComponent = 'input'> =
  ComboboxPrimitive.ComboboxInputProps<T> & { class?: string | undefined };

const ComboboxInput = <T extends ValidComponent = 'input'>(
  props: PolymorphicProps<T, ComboboxInputProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxInputProps, ['class']);
  return (
    <ComboboxPrimitive.Input
      class={cn(
        'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-placeholder disabled:opacity-50',
        local.class,
      )}
      {...others}
    />
  );
};

type ComboboxTriggerProps<T extends ValidComponent = 'button'> =
  ComboboxPrimitive.ComboboxTriggerProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const ComboboxTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, ComboboxTriggerProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxTriggerProps, ['class', 'children']);
  return (
    <ComboboxPrimitive.Trigger class={cn('size-4 opacity-50', local.class)} {...others}>
      <ComboboxPrimitive.Icon>
        {local.children ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
          >
            <path d="M8 9l4 -4l4 4" />
            <path d="M16 15l-4 4l-4 -4" />
          </svg>
        )}
      </ComboboxPrimitive.Icon>
    </ComboboxPrimitive.Trigger>
  );
};

type ComboboxContentProps<T extends ValidComponent = 'div'> =
  ComboboxPrimitive.ComboboxContentProps<T> & { class?: string | undefined };

const ComboboxContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, ComboboxContentProps<T>>,
) => {
  const [local, others] = splitProps(props as ComboboxContentProps, ['class']);
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Content
        class={cn(
          'relative z-50 min-w-32 animate-in overflow-hidden rounded-card border bg-surface-overlay text-main shadow-md fade-in-80',
          local.class,
        )}
        {...others}
      >
        <ComboboxPrimitive.Listbox class="m-0 p-1" />
      </ComboboxPrimitive.Content>
    </ComboboxPrimitive.Portal>
  );
};

export {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxHiddenSelect,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxSection,
  ComboboxTrigger,
};
