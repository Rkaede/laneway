import type { Component } from 'solid-js';

export const Loader: Component = () => {
  return (
    <div role="status" class="inline-flex gap-1">
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s] motion-reduce:hidden" />
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s] motion-reduce:hidden" />
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-brand motion-reduce:hidden" />
      <span class="sr-only text-sm text-muted motion-reduce:not-sr-only">Loading…</span>
    </div>
  );
};
