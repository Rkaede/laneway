import { type Component, createEffect, createSignal, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';

import { LocalImage } from '~/components/ui/local-image';

type Image = {
  src: string;
  alt: string;
  width: number;
  height: number;
  fullSizeSrc?: string;
  thumbnailSrc?: string;
  storageId?: string;
  sourceType?: 'store' | 'path';
};

type LightboxProps = {
  images: Image[];
  initialIndex?: number;
  onClose?: () => void;
  open?: boolean;
};

export const Lightbox: Component<LightboxProps> = (props) => {
  const [currentIndex, setCurrentIndex] = createSignal(props.initialIndex || 0);
  const [isOpen, setIsOpen] = createSignal(props.open || false);

  createEffect(() => {
    if (props.open !== undefined) {
      setIsOpen(props.open);
    }
  });

  createEffect(() => {
    if (props.initialIndex !== undefined) {
      setCurrentIndex(props.initialIndex);
    }
  });

  const currentImage = () => props.images[currentIndex()];

  const handleClose = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? props.images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === props.images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const renderThumbnails = () => {
    return (
      <div class="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-gradient-to-b from-black/0 to-black/60">
        <div class="mx-auto mb-6 mt-6 flex h-14 justify-center gap-4">
          <For each={props.images}>
            {(image, index) => {
              return (
                <button
                  class={`relative inline-block shrink-0 transform-gpu overflow-hidden focus:outline-none ${index() === currentIndex() ? 'z-20 rounded-md shadow shadow-black/50' : 'z-10 rounded-md'}`}
                  style={{
                    width: '75px',
                    height: '56px',
                    transform: `scale(${index() === currentIndex() ? 1.25 : 1}) translateZ(0px)`,
                  }}
                  onClick={() => handleThumbnailClick(index())}
                >
                  {image.storageId && (
                    <LocalImage
                      src={image.storageId}
                      alt={image.alt || ''}
                      sourceType={image.sourceType}
                      class={`${
                        index() === currentIndex()
                          ? 'brightness-110 hover:brightness-110'
                          : 'brightness-[0.8] contrast-125 hover:brightness-75'
                      } h-full w-full transform object-cover transition`}
                    />
                  )}
                  {!image.storageId && (
                    <img
                      alt={image.alt}
                      src={image.thumbnailSrc || image.src}
                      width={100}
                      height={75}
                      class={`${
                        index() === currentIndex()
                          ? 'brightness-110 hover:brightness-110'
                          : 'brightness-[0.8] contrast-125 hover:brightness-75'
                      } h-full w-full transform object-cover transition`}
                      loading="lazy"
                    />
                  )}
                </button>
              );
            }}
          </For>
        </div>
      </div>
    );
  };

  createEffect(() => {
    if (isOpen()) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleClose();
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });

  return (
    <Show when={isOpen()}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div class="fixed inset-0 bg-black/90 backdrop-blur-2xl" aria-hidden="true" />

          <div class="absolute right-0 top-0 flex items-center gap-2 p-3 text-white">
            <button
              class="z-50 rounded-full bg-gray-700/50 p-2 text-white backdrop-blur-lg transition"
              onClick={handleClose}
              aria-label="Close lightbox"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
                class="size-5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="wide:h-full xl:taller-than-854:h-auto relative flex aspect-[3/2] w-full max-w-7xl items-center">
            <div class="w-full overflow-hidden">
              <div class="relative flex aspect-[3/2] items-center justify-center">
                <div class="absolute" style={{ opacity: '1', transform: 'none' }}>
                  {currentImage().storageId && (
                    <LocalImage
                      src={currentImage().storageId!}
                      alt={currentImage().alt || ''}
                      sourceType={currentImage().sourceType}
                      class="max-h-[78vh] max-w-full object-contain"
                    />
                  )}
                  {!currentImage().storageId && (
                    <img
                      alt={currentImage().alt}
                      src={currentImage().src}
                      width={currentImage().width}
                      height={currentImage().height}
                      decoding="async"
                      style={{
                        color: 'transparent',
                        'max-height': '78vh',
                        'max-width': '100%',
                        'object-fit': 'contain',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div class="absolute inset-0 mx-auto flex max-w-7xl items-center justify-center">
              <div class="relative aspect-[3/2] max-h-full w-full">
                <Show when={props.images.length > 1}>
                  <button
                    class="absolute left-3 top-[calc(50%-16px)] rounded-full bg-gray-700/50 p-2 text-white backdrop-blur-lg transition"
                    style={{ transform: 'translate3d(0px, 0px, 0px)' }}
                    onClick={handlePrevious}
                    aria-label="Previous image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                      class="size-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>
                </Show>

                <Show when={props.images.length > 1}>
                  <button
                    class="absolute right-3 top-[calc(50%-16px)] rounded-full bg-gray-700/50 p-2 text-white backdrop-blur-lg transition"
                    style={{ transform: 'translate3d(0px, 0px, 0px)' }}
                    onClick={handleNext}
                    aria-label="Next image"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                      class="size-5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </Show>
              </div>

              <Show when={props.images.length > 1}>{renderThumbnails()}</Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
