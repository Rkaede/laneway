import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

export type LabelProps = JSX.HTMLAttributes<HTMLLabelElement>;

export const Label: Component<LabelProps> = (props) => {
  return (
    <label
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      {...props}
    />
  );
};

export const Tokens: Component<{ tokens?: number; class?: string }> = (props) => {
  return (
    <div class={props.class}>
      <Show when={props.tokens} fallback="N/A">
        {(tokens) => `${tokens().toLocaleString()} tokens`}
      </Show>
    </div>
  );
};

export const Price: Component<{ pricing?: number; class?: string }> = (props) => {
  return (
    <div class={props.class}>
      <Show when={props.pricing} fallback="N/A">
        {(pricing) => `$${(pricing() * 1000000).toFixed(2)} / 1M tokens`}
      </Show>
    </div>
  );
};
