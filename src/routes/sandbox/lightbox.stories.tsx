import { createSignal, For, Show } from 'solid-js';

import { Button } from '~/components/ui/button';
import { Lightbox } from '~/components/ui/lightbox/lightbox';

import { sampleImageUrl } from './story-fixtures';

const sampleImages = ['One', 'Two', 'Three'].map((label) => ({
  src: sampleImageUrl(label),
  // A separate image, so the grid and the thumbnail strip show that they read thumbnailSrc.
  thumbnailSrc: sampleImageUrl(`${label} thumbnail`, '#3f7d6e'),
  alt: `Sample image ${label.toLowerCase()}`,
  width: 1200,
  height: 800,
}));

// Each story mounts the lightbox only while it is open, as MessageView does. The lightbox keeps
// the image it was last showing, so one left mounted would reopen there, not at initialIndex.

export function WithInitialIndex() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-3 gap-4">
        <For each={sampleImages}>
          {(image) => (
            <div class="overflow-hidden rounded-md">
              <img
                src={image.thumbnailSrc || image.src}
                alt={image.alt}
                class="h-40 w-full cursor-pointer object-cover transition-transform hover:scale-110"
                onClick={() => {
                  setOpen(true);
                }}
              />
            </div>
          )}
        </For>
      </div>
      <Show when={open()}>
        <Lightbox
          images={sampleImages}
          initialIndex={1}
          open={open()}
          onClose={() => setOpen(false)}
        />
      </Show>
    </div>
  );
}

export function GalleryWithLightbox() {
  const [open, setOpen] = createSignal(false);
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-3 gap-4">
        <For each={sampleImages}>
          {(image, index) => (
            <div class="overflow-hidden rounded-md">
              <img
                src={image.thumbnailSrc || image.src}
                alt={image.alt}
                class="h-40 w-full cursor-pointer object-cover transition-transform hover:scale-110"
                onClick={() => openLightbox(index())}
              />
            </div>
          )}
        </For>
      </div>
      <Show when={open()}>
        <Lightbox
          images={sampleImages}
          initialIndex={currentIndex()}
          open={open()}
          onClose={() => setOpen(false)}
        />
      </Show>
    </div>
  );
}

export function SingleImage() {
  const [open, setOpen] = createSignal(false);
  const image = { src: sampleImageUrl('Single'), alt: 'One image', width: 1200, height: 800 };

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open, with no arrows or thumbnails
      </Button>
      <Show when={open()}>
        <Lightbox images={[image]} open={open()} onClose={() => setOpen(false)} />
      </Show>
    </div>
  );
}

export function StoredImages() {
  const [open, setOpen] = createSignal(false);
  const images = ['One', 'Two'].map((label) => ({
    src: label,
    storageId: sampleImageUrl(label),
    sourceType: 'path' as const,
    alt: label,
    width: 1200,
    height: 800,
  }));

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open images loaded through LocalImage
      </Button>
      <Show when={open()}>
        <Lightbox images={images} open={open()} onClose={() => setOpen(false)} />
      </Show>
    </div>
  );
}
