import { useSearchParams } from '@solidjs/router';
import { createEffect, on, onCleanup } from 'solid-js';

import { findMessageElement, messageIdFromQuery } from '~/routes/session-query';

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-border-focus/60'];
const HIGHLIGHT_MS = 2000;
const MAX_FRAMES = 30;

/**
 * Scrolls to the message named by `?message=` and highlights it briefly, then drops the parameter
 * so reloading or searching for the same message again works.
 */
export function useScrollToMessage(ready: () => boolean) {
  const [searchParams, setSearchParams] = useSearchParams();

  createEffect(
    on(
      () => [messageIdFromQuery(searchParams.message), ready()] as const,
      ([messageId, isReady]) => {
        if (!messageId || !isReady) return;

        let frame = 0;
        let attempts = 0;

        const run = () => {
          const element = findMessageElement(document, messageId);
          if (!element && attempts++ < MAX_FRAMES) {
            frame = requestAnimationFrame(run);
            return;
          }
          if (element) {
            element.scrollIntoView({ block: 'center' });
            element.classList.add(...HIGHLIGHT_CLASSES);
            setTimeout(() => element.classList.remove(...HIGHLIGHT_CLASSES), HIGHLIGHT_MS);
          }
          setSearchParams({ message: undefined }, { replace: true });
        };
        frame = requestAnimationFrame(run);

        // Dropping the parameter below re-runs this effect, so the highlight must outlive the
        // cleanup. Its own timer removes it.
        onCleanup(() => cancelAnimationFrame(frame));
      },
    ),
  );
}
