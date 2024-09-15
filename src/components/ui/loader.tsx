import type { Component } from 'solid-js';

export const Loader: Component = () => {
  return (
    <div class="inline-flex gap-1">
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
      <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-accent" />
    </div>
  );
};
