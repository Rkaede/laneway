import * as DropdownMenuPrimitive from '@kobalte/core/dropdown-menu';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { Component, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenu: Component<DropdownMenuPrimitive.DropdownMenuRootProps> = (props) => {
  return <DropdownMenuPrimitive.Root gutter={4} {...props} />;
};

type DropdownMenuContentProps<T extends ValidComponent = 'div'> =
  DropdownMenuPrimitive.DropdownMenuContentProps<T> & {
    class?: string | undefined;
  };

const DropdownMenuContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, DropdownMenuContentProps<T>>,
) => {
  const [, rest] = splitProps(props as DropdownMenuContentProps, ['class']);
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        class={cn(
          'z-50 min-w-32 origin-[var(--kb-menu-content-transform-origin)] overflow-hidden rounded-card border bg-surface-overlay p-1 text-main shadow-md data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95',
          props.class,
        )}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
};

type DropdownMenuItemProps<T extends ValidComponent = 'div'> =
  DropdownMenuPrimitive.DropdownMenuItemProps<T> & {
    class?: string | undefined;
  };

const DropdownMenuItem = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, DropdownMenuItemProps<T>>,
) => {
  const [, rest] = splitProps(props as DropdownMenuItemProps, ['class']);
  return (
    <DropdownMenuPrimitive.Item
      class={cn(
        'relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm font-menu outline-hidden transition-colors select-none focus:bg-surface-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-surface-hover',
        props.class,
      )}
      {...rest}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
};
