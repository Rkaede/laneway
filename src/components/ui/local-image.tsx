import { createSignal, onMount, Show } from 'solid-js';

import { imageCache } from '~/services/image-cache';
import { cn } from '~/util';

interface ImageProps {
  src: string;
  alt?: string;
  class?: string;
}

export function LocalImage(props: ImageProps) {
  const [imageSrc, setImageSrc] = createSignal<string | null>(null);
  const [available, setAvailable] = createSignal(true);

  onMount(async () => {
    const cachedImage = await imageCache.get('/' + props.src);

    if (cachedImage) {
      setImageSrc(URL.createObjectURL(cachedImage));
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
            'h-32 w-64 content-center rounded-lg bg-muted p-4 text-center text-sm font-medium text-muted-foreground shadow-sm',
            props.class,
          )}
        >
          Oh no! Image not found.
        </div>
      }
    >
      <img
        src={imageSrc() || ''}
        alt={props.alt}
        class={cn('w-full max-w-64 rounded-lg shadow-sm', props.class)}
      />
    </Show>
  );
}
