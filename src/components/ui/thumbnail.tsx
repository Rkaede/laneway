import { Component, createSignal, JSX } from 'solid-js';

import { IconClose } from '~/components/icons/ui';
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
          class="size-full max-h-16 overflow-hidden rounded-md border border-background-4 bg-muted object-cover object-left-top"
        />
        {props.onRemove && (
          <div class="absolute right-[2px] top-0 z-20">
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
                'rounded-full border border-background-4 bg-background-3 p-0.5 text-foreground',
                'transition-colors hover:scale-105 hover:border-red-500 hover:bg-red-500',
                'opacity-0 group-hover:opacity-100',
              )}
            >
              <IconClose class="size-3" />
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
