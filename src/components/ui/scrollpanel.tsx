import { cva, VariantProps } from 'class-variance-authority';
import { JSX } from 'solid-js';

// Scrolling with flexbox layouts can be hard. This component tries to wrangle all the different
// scrolling states along with styling features into a single component.
const scrollPanelVariants = cva('flex min-h-full flex-col-reverse overflow-auto', {
  variants: {
    debug: {
      true: 'outline -outline-offset-2 outline-warning',
    },
  },
  defaultVariants: {},
});

export function ScrollPanel(props: ScrollPanelProps) {
  return (
    <div
      data-component="ScrollPanel"
      class={scrollPanelVariants({ class: props.class, debug: props.debug })}
    >
      <div class="relative flex-1">
        {props.children}
        {props.fadeBottom && <FadeOutBottom />}
      </div>
    </div>
  );
}

function FadeOutBottom() {
  return (
    <div class="sticky right-0 bottom-0 left-0 h-8 w-full bg-linear-to-b from-transparent to-surface" />
  );
}

export type ScrollPanelVariantProps = VariantProps<typeof scrollPanelVariants>;

type ScrollPanelProps = ScrollPanelVariantProps & {
  class?: string;
  children?: JSX.Element;
  fadeBottom?: boolean;
};
