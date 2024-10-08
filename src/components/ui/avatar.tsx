import type { JSX, ParentComponent } from 'solid-js';

import { cn } from '~/util';

export type AvatarProps = Partial<JSX.HTMLAttributes<HTMLDivElement>>;

export const Avatar: ParentComponent<AvatarProps> = (props) => {
  return (
    <div
      class={cn(
        'flex size-8 shrink-0 select-none items-center justify-center rounded-full border bg-white/10 shadow',
      )}
      {...props}
    >
      {props.children}
    </div>
  );
};
