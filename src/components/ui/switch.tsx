import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as SwitchPrimitive from '@kobalte/core/switch';
import type { ParentProps, ValidComponent, VoidProps } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

export const SwitchLabel = SwitchPrimitive.Label;
export const Switch = SwitchPrimitive.Root;

type SwitchControlProps = ParentProps<SwitchPrimitive.SwitchControlProps & { class?: string }>;

export const SwitchControl = <T extends ValidComponent = 'input'>(
  props: PolymorphicProps<T, SwitchControlProps>,
) => {
  const [local, rest] = splitProps(props as SwitchControlProps, ['class', 'children']);

  return (
    <>
      <SwitchPrimitive.Input
        class={cn(
          '[&:focus-visible+div]:border-border-focus [&:focus-visible+div]:ring-[3px] [&:focus-visible+div]:ring-border-focus/50 [&:focus-visible+div]:outline-hidden',
          local.class,
        )}
      />
      <SwitchPrimitive.Control
        class={cn(
          'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-neutral-8 shadow-xs transition-[color,background-color,box-shadow] data-[checked]:bg-brand data-[disabled]:opacity-50',
          local.class,
        )}
        {...rest}
      >
        {local.children}
      </SwitchPrimitive.Control>
    </>
  );
};

type SwitchThumbProps = VoidProps<SwitchPrimitive.SwitchControlProps & { class?: string }>;

export const SwitchThumb = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, SwitchThumbProps>,
) => {
  const [local, rest] = splitProps(props as SwitchThumbProps, ['class']);

  return (
    <SwitchPrimitive.Thumb
      class={cn(
        'pointer-events-none block h-4 w-4 translate-x-0 rounded-full bg-surface-raised shadow-md ring-0 transition-transform data-[checked]:translate-x-4',
        local.class,
      )}
      {...rest}
    />
  );
};
