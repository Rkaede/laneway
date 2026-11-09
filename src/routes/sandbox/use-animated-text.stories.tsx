import { createSignal } from 'solid-js';

import createAnimatedText from '~/hooks/create-animated-text';

export function Basic() {
  const [text] = createSignal('Hello world! This is an animated text example.');
  const animatedText = createAnimatedText(text);

  return (
    <div class="max-w-md">
      <p class="font-mono">{animatedText.animatedText()}</p>
    </div>
  );
}

export function Changing() {
  const message = 'First message that appears...';
  const [text, setText] = createSignal(message);
  const animatedText = createAnimatedText(text, { type: 'word' });

  const appendText = () => {
    setText(text() + '\n' + message);
  };

  return (
    <div class="flex max-w-md flex-col gap-4">
      <p class="font-mono whitespace-pre-line">{animatedText.animatedText()}</p>
      <button
        class="w-fit rounded-md bg-surface-hover px-4 py-2 hover:bg-surface-pressed"
        onClick={appendText}
      >
        Append Text
      </button>
    </div>
  );
}
