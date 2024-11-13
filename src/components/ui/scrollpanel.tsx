import { cva, VariantProps } from 'class-variance-authority';
import { JSX } from 'solid-js';

// Scrolling with flexbox layouts can be hard. This component tries to wrangle all the different
// scrolling states along with styling features into a single component.
const scrollPanelVariants = cva('overflow-auto flex flex-col-reverse min-h-full', {
  variants: {
    debug: {
      true: 'outline outline-orange-300 -outline-offset-2',
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
  return <div class="bg-fade-out sticky bottom-0 left-0 right-0 h-8 w-full" />;
}

export type ScrollPanelVariantProps = VariantProps<typeof scrollPanelVariants>;

type ScrollPanelProps = ScrollPanelVariantProps & {
  class?: string;
  children?: JSX.Element;
  fadeBottom?: boolean;
};
