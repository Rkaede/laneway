import { Component, createSignal, JSX } from 'solid-js';

import { IconX } from '~/components/icons/ui';
import { Dialog, DialogContent } from '~/components/ui/dialog';
import { cn } from '~/util';

interface ThumbnailProps {
  file: string;
  onRemove?: () => void;
  alt: string;
}

export const Thumbnail: Component<ThumbnailProps> = (props) => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  const handleKeyDown: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div
        role="button"
        class={cn(
          'group relative flex size-16 items-center justify-center rounded-md opacity-80 transition-opacity hover:opacity-100',
          'cursor-pointer',
        )}
        onClick={() => setIsDialogOpen(true)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <img
          src={props.file}
          alt={props.alt}
          class="size-full max-h-16 overflow-hidden rounded-md border border-border-emphasis bg-surface-sunken object-cover object-left-top"
        />
        {props.onRemove && (
          <div class="absolute top-0 right-[2px] z-20">
            <button
              type="button"
              aria-label="Remove image"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onRemove?.();
              }}
              class={cn(
                'relative z-30 translate-x-[40%] translate-y-[-40%]',
                'rounded-full border border-border-emphasis bg-surface-overlay p-0.5 text-main',
                'transition-colors hover:scale-105 hover:border-danger hover:bg-danger hover:text-danger-fg',
                'opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0',
              )}
            >
              <IconX class="size-3" />
            </button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen()} onOpenChange={setIsDialogOpen}>
        <DialogContent class="flex items-center justify-center sm:max-h-[90vh] sm:max-w-[90vw]">
          <img src={props.file} alt={props.alt} class="max-h-full max-w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
};
