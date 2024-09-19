import { onCleanup } from 'solid-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useWindowResizeListener = (listener: (event: UIEvent) => any) => {
  const handler: typeof listener = (event) => listener(event);

  window.addEventListener('resize', handler);
  onCleanup(() => window.removeEventListener('resize', handler));
};
