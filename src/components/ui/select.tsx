import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as SelectPrimitive from '@kobalte/core/select';
import type { ParentProps, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectDescription = SelectPrimitive.Description;
export const SelectErrorMessage = SelectPrimitive.ErrorMessage;
export const SelectItemDescription = SelectPrimitive.ItemDescription;
export const SelectHiddenSelect = SelectPrimitive.HiddenSelect;
export const SelectSection = SelectPrimitive.Section;

type SelectTriggerProps = ParentProps<SelectPrimitive.SelectTriggerProps & { class?: string }>;

export const SelectTrigger = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, SelectTriggerProps>,
) => {
  const [local, rest] = splitProps(props as SelectTriggerProps, ['class', 'children']);

  return (
    <SelectPrimitive.Trigger
      class={cn(
        'flex h-input-md w-full items-center justify-between rounded-md border border-border-emphasis bg-surface-input px-input-x-md py-input-y-md text-sm shadow-field transition-shadow placeholder:text-placeholder focus:outline-hidden focus-visible:border-field-focus focus-visible:ring-(length:--field-focus-ring-w) focus-visible:ring-border-focus/50 disabled:opacity-50',
        local.class,
      )}
      {...rest}
    >
      {local.children}
      <SelectPrimitive.Icon
        as="svg"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="flex size-4 items-center justify-center"
      >
        <path d="m6 9 6 6 6-6" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
};

type SelectContentProps = SelectPrimitive.SelectContentProps & {
  class?: string;
};

export const SelectContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, SelectContentProps>,
) => {
  const [local, rest] = splitProps(props as SelectContentProps, ['class']);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        class={cn(
          'relative z-50 min-w-[8rem] overflow-hidden rounded-card border bg-surface-overlay text-main shadow-md data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95',
          local.class,
        )}
        {...rest}
      >
        <SelectPrimitive.Listbox class="p-1 focus-visible:outline-hidden" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
};

type SelectItemProps = ParentProps<SelectPrimitive.SelectItemProps & { class?: string }>;

export const SelectItem = <T extends ValidComponent = 'li'>(
  props: PolymorphicProps<T, SelectItemProps>,
) => {
  const [local, rest] = splitProps(props as SelectItemProps, ['class', 'children']);

  return (
    <SelectPrimitive.Item
      class={cn(
        'relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm font-menu outline-hidden select-none hover:bg-surface-hover focus:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-hover',
        local.class,
      )}
      {...rest}
    >
      <SelectPrimitive.ItemIndicator class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center text-brand">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="m5 12l5 5L20 7"
          />
        </svg>
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
    </SelectPrimitive.Item>
  );
};
