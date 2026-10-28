import { type JSX, splitProps } from 'solid-js';

import { cn } from '~/util';

export type InputProps = Partial<JSX.InputHTMLAttributes<HTMLInputElement>>;

export const Input = (props: InputProps) => {
  const [localProps, rest] = splitProps(props, ['class']);

  return (
    <input class={cn('input input-md border-border-emphasis', localProps.class)} {...rest} />
  );
};
