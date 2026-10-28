import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

export type LabelProps = JSX.HTMLAttributes<HTMLLabelElement>;

export const Label: Component<LabelProps> = (props) => {
  return (
    <label class="peer- text-sm leading-none font-medium peer-disabled:opacity-70" {...props} />
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
      {props.pricing === undefined
        ? 'N/A'
        : `$${(props.pricing * 1000000).toFixed(2)} / 1M tokens`}
    </div>
  );
};
