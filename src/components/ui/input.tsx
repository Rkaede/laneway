import { type JSX, splitProps } from 'solid-js';

import { cn } from '~/util';

export type InputProps = Partial<JSX.InputHTMLAttributes<HTMLInputElement>>;

export const Input = (props: InputProps) => {
  const [localProps, rest] = splitProps(props, ['class']);

  return (
    <input
      class={cn(
        'border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        localProps.class,
      )}
      {...rest}
    />
  );
};
