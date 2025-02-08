import type { ParentComponent } from 'solid-js';

export const AvatarGroup: ParentComponent = (props) => {
  return <div class="flex -space-x-2 overflow-hidden">{props.children}</div>;
};
