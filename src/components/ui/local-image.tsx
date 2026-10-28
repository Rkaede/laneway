import { createEffect, createSignal, onCleanup, Show } from 'solid-js';

import { imageCache } from '~/services/image-cache';
import { cn } from '~/util';

interface ImageProps {
  src: string;
  alt?: string;
  class?: string;
  sourceType?: 'store' | 'path';
  onClick?: (event: MouseEvent) => void;
}

export function LocalImage(props: ImageProps) {
  const [imageSrc, setImageSrc] = createSignal<string | null>(null);
  const [available, setAvailable] = createSignal(true);

  createEffect(async () => {
    let disposed = false;
    let url: string | undefined;
    onCleanup(() => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    });

    if (props.sourceType === 'path') {
      setImageSrc(props.src);
      return;
    }
    const cachedImage = await imageCache.get('/' + props.src);
    if (disposed) return;

    if (cachedImage) {
      url = URL.createObjectURL(cachedImage);
      setImageSrc(url);
    } else {
      setAvailable(false);
    }
  });

  return (
    <Show
      when={available()}
      fallback={
        <div
          class={cn(
            'h-32 w-64 content-center rounded-card bg-surface-sunken p-4 text-center text-sm font-medium text-muted shadow-xs',
            props.class,
          )}
        >
          Oh no! Image not found.
        </div>
      }
    >
      <img src={imageSrc() || ''} alt={props.alt} class={props.class} onClick={props.onClick} />
    </Show>
  );
}
