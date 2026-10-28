import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { PopoverContentProps, PopoverRootProps } from '@kobalte/core/popover';
import { Popover as PopoverPrimitive } from '@kobalte/core/popover';
import type { ParentProps, ValidComponent } from 'solid-js';
import { mergeProps, splitProps } from 'solid-js';

import { cn } from '~/util';

export const PopoverTrigger = PopoverPrimitive.Trigger;

export const Popover = (props: PopoverRootProps) => {
  const merge = mergeProps<PopoverRootProps[]>({ gutter: 4 }, props);

  return <PopoverPrimitive {...merge} />;
};

type popoverContentProps<T extends ValidComponent = 'div'> = ParentProps<
  PopoverContentProps<T> & {
    class?: string;
    showCloseButton?: boolean;
  }
>;

export const PopoverContent = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, popoverContentProps<T>>,
) => {
  const [local, rest] = splitProps(props as popoverContentProps, [
    'class',
    'children',
    'showCloseButton',
  ]);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        class={cn(
          'z-50 w-72 rounded-card border bg-surface-overlay p-4 text-main shadow-md outline-hidden data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[expanded]:animate-in data-[expanded]:fade-in-0 data-[expanded]:zoom-in-95',
          local.class,
        )}
        {...rest}
      >
        {local.children}
        {local.showCloseButton && (
          <PopoverPrimitive.CloseButton class="absolute top-3 right-3 rounded-sm opacity-70 transition-[opacity,box-shadow] hover:bg-surface-hover hover:opacity-100 focus:outline-hidden focus-visible:ring-[3px] focus-visible:ring-border-focus/50 disabled:pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
              <path
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M18 6L6 18M6 6l12 12"
              />
            </svg>
            <span class="sr-only">Close</span>
          </PopoverPrimitive.CloseButton>
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
};
