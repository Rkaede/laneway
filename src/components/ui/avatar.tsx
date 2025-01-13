import type { JSX, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { cn } from '~/util';

export type AvatarProps = Partial<JSX.HTMLAttributes<HTMLDivElement>> & {
  variant?: 'flat' | 'primary';
};

export const Avatar: ParentComponent<AvatarProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  return (
    <div
      class={cn(
        'flex size-8 shrink-0 select-none items-center justify-center rounded-full border bg-white/10 shadow',
        local.class,
      )}
      classList={{
        'shadow-none': local.variant === 'flat',
      }}
      {...rest}
    >
      {props.children}
    </div>
  );
};
