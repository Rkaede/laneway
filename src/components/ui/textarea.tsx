import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { TextFieldTextAreaProps } from '@kobalte/core/text-field';
import { TextArea as TextFieldPrimitive } from '@kobalte/core/text-field';
import type { ValidComponent, VoidProps } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

type textAreaProps<T extends ValidComponent = 'textarea'> = VoidProps<
  TextFieldTextAreaProps<T> & {
    class?: string;
  }
>;

export const TextArea = <T extends ValidComponent = 'textarea'>(
  props: PolymorphicProps<T, textAreaProps<T>>,
) => {
  const [local, rest] = splitProps(props as textAreaProps, ['class']);

  return (
    <TextFieldPrimitive
      class={cn('input min-h-[60px] border-border-emphasis px-3 py-2 text-sm', local.class)}
      {...rest}
    />
  );
};
