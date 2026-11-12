import { type JSX, splitProps } from 'solid-js';

import { cn } from '~/util';

export type InputProps = Partial<JSX.InputHTMLAttributes<HTMLInputElement>> & {
  /**
   * Let password managers offer to fill this field. Off by default: 1Password otherwise puts its
   * button in every field. Turn it on for secrets people keep in a password manager, such as an
   * API key.
   */
  passwordManager?: boolean;
};

export const Input = (props: InputProps) => {
  const [localProps, rest] = splitProps(props, ['class', 'passwordManager']);

  return (
    <input
      class={cn('field input input-md', localProps.class)}
      data-1p-ignore={localProps.passwordManager ? undefined : ''}
      {...rest}
    />
  );
};
