import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import * as SliderPrimitive from '@kobalte/core/slider';
import type { JSX, ValidComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { Label } from '~/components/ui/text';
import { cn } from '~/util';

type SliderRootProps<T extends ValidComponent = 'div'> = SliderPrimitive.SliderRootProps<T> & {
  class?: string | undefined;
};

const Slider = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, SliderRootProps<T>>,
) => {
  const [local, others] = splitProps(props as SliderRootProps, ['class']);
  return (
    <SliderPrimitive.Root
      class={cn(
        'relative flex w-full touch-none flex-col items-center select-none',
        local.class,
      )}
      {...others}
    />
  );
};

type SliderTrackProps<T extends ValidComponent = 'div'> =
  SliderPrimitive.SliderTrackProps<T> & {
    class?: string | undefined;
  };

const SliderTrack = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, SliderTrackProps<T>>,
) => {
  const [local, others] = splitProps(props as SliderTrackProps, ['class']);
  return (
    <SliderPrimitive.Track
      class={cn('relative h-1 w-full grow rounded-full bg-neutral-6', local.class)}
      {...others}
    />
  );
};

type SliderFillProps<T extends ValidComponent = 'div'> = SliderPrimitive.SliderFillProps<T> & {
  class?: string | undefined;
};

const SliderFill = <T extends ValidComponent = 'div'>(
  props: PolymorphicProps<T, SliderFillProps<T>>,
) => {
  const [local, others] = splitProps(props as SliderFillProps, ['class']);
  return (
    <SliderPrimitive.Fill
      class={cn('absolute h-full rounded-full bg-neutral-9', local.class)}
      {...others}
    />
  );
};

type SliderThumbProps<T extends ValidComponent = 'span'> =
  SliderPrimitive.SliderThumbProps<T> & {
    class?: string | undefined;
    children?: JSX.Element;
  };

const SliderThumb = <T extends ValidComponent = 'span'>(
  props: PolymorphicProps<T, SliderThumbProps<T>>,
) => {
  const [local, others] = splitProps(props as SliderThumbProps, ['class', 'children']);
  return (
    <SliderPrimitive.Thumb
      class={cn(
        'top-[-6px] block size-4 rounded-full border border-brand bg-brand shadow-xs transition-colors focus-visible:ring-[3px] focus-visible:ring-border-focus/50 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
        local.class,
      )}
      {...others}
    >
      <SliderPrimitive.Input />
    </SliderPrimitive.Thumb>
  );
};

const SliderLabel = <T extends ValidComponent = 'label'>(
  props: PolymorphicProps<T, SliderPrimitive.SliderLabelProps<T>>,
) => {
  return <SliderPrimitive.Label as={Label} {...props} />;
};

const SliderValueLabel = <T extends ValidComponent = 'label'>(
  props: PolymorphicProps<T, SliderPrimitive.SliderValueLabelProps<T>>,
) => {
  return <SliderPrimitive.ValueLabel as={Label} {...props} />;
};

export { Slider, SliderFill, SliderLabel, SliderThumb, SliderTrack, SliderValueLabel };
