import { createSignal, For } from 'solid-js';

import { Lightbox } from '~/components/ui/lightbox/lightbox';

// Optimized sample images with different sizes
const sampleImages = [
  {
    // Use smaller images with query parameters for thumbnails
    src: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=1200',
    alt: 'Mountain landscape with a lake',
    width: 1200,
    height: 800,
    // Thumbnail version for better performance
    thumbnailSrc: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=60&w=400',
    // Full size version for download and fullscreen viewing
    fullSizeSrc: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=100&w=2670',
  },
  {
    src: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?q=80&w=1200',
    alt: 'Sunset over the ocean',
    width: 1200,
    height: 800,
    thumbnailSrc: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?q=60&w=400',
    fullSizeSrc: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?q=100&w=2670',
  },
  {
    src: 'https://images.unsplash.com/photo-1682686581221-c126206d12f0?q=80&w=1200',
    alt: 'Forest with fog',
    width: 1200,
    height: 800,
    thumbnailSrc: 'https://images.unsplash.com/photo-1682686581221-c126206d12f0?q=60&w=400',
    fullSizeSrc: 'https://images.unsplash.com/photo-1682686581221-c126206d12f0?q=100&w=2670',
  },
];

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
      <Lightbox
        images={sampleImages}
        initialIndex={1}
        open={open()}
        onClose={() => setOpen(false)}
      />
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
      <Lightbox
        images={sampleImages}
        initialIndex={currentIndex()}
        open={open()}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
