// this is a fork of https://github.com/bigmistqke/solid-textarea-autosize
// it's a workaround for a typescript issue:
// https://github.com/bigmistqke/solid-textarea-autosize/pull/1

import { ComponentProps, createEffect, createSignal, on } from 'solid-js';

import calculateNodeHeight from './calculateNodeHeight';
import getSizingData, { SizingData } from './getSizingData';
import { useWindowResizeListener } from './hooks';

type TextareaProps = ComponentProps<'textarea'>;

type Style = NonNullable<TextareaProps['style']> & {
  height?: never;
  'max-height'?: never;
  'min-height'?: never;
};

export type TextareaHeightChangeMeta = {
  rowHeight: number;
};
export interface TextareaAutosizeProps extends Omit<TextareaProps, 'style'> {
  /**
   * Maximum number of rows up to which the textarea can grow
   */
  maxRows?: number;
  /**
   * Minimum number of rows to show for textarea
   */
  minRows?: number;
  /**
   * Setting rows is not allowed.
   * Use maxRows and minRows instead.
   */
  rows?: never;
  /**
   * Function invoked on textarea height change, with height as first argument.
   * The second function argument is an object containing additional information
   * that might be useful for custom behaviors.
   * Current options include { rowHeight: number }.
   */
  onHeightChange?: (height: number, meta: TextareaHeightChangeMeta) => void;
  /**
   * Reuse previously computed measurements when computing height of textarea. Default: false
   */
  cacheMeasurements?: boolean;
  style?: Style;
}

function TextareaAutosize(props: TextareaAutosizeProps & TextareaProps) {
  const [textarea, setTextarea] = createSignal<HTMLTextAreaElement>();
  let heightRef = 0;
  let measurementsCacheRef: SizingData | undefined = undefined;

  const resizeTextarea = () => {
    const node = textarea();
    if (!node) return;
    const nodeSizingData =
      props.cacheMeasurements && measurementsCacheRef
        ? measurementsCacheRef
        : getSizingData(node);

    if (!nodeSizingData) {
      return;
    }

    measurementsCacheRef = nodeSizingData;

    const [height, rowHeight] = calculateNodeHeight(
      nodeSizingData,
      node.value || node.placeholder || 'x',
      props.minRows,
      props.maxRows,
    );

    if (heightRef !== height) {
      heightRef = height;
      node.style.setProperty('height', `${height}px`, 'important');
      props.onHeightChange?.(height, { rowHeight });
    }
  };

  const handleChange = (
    event: InputEvent & {
      currentTarget: HTMLTextAreaElement;
      target: HTMLTextAreaElement;
    },
  ) => {
    resizeTextarea();
    if (typeof props.oninput === 'function') props.oninput(event);
    if (typeof props.onInput === 'function') props.onInput(event);
  };

  createEffect(on(() => props.value, resizeTextarea));

  createEffect(() => {
    if (typeof document !== 'undefined' && textarea()) {
      resizeTextarea();
      useWindowResizeListener(resizeTextarea);
    }
  });

  return <textarea {...props} onInput={handleChange} ref={(element) => setTextarea(element)} />;
}

export default TextareaAutosize;
