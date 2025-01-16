import { createEffect, createSignal } from 'solid-js';

import createAnimatedText from '~/hooks/create-animated-text';
import { stillAlive } from '~/services/llm-mock';

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
  const texts = [
    'First message that appears...',
    'Then this one shows up!',
    'And finally this message appears.',
  ];
  const [text, setText] = createSignal(texts[0]);
  const animatedText = createAnimatedText(() => stillAlive, { type: 'word' });

  const appendText = () => {
    setText(text() + '\n' + texts[0]);
  };

  return (
    <div class="flex max-w-md flex-col gap-4">
      <p class="whitespace-pre-line font-mono">{animatedText.animatedText()}</p>
      <button
        class="w-fit rounded-md bg-background-2 px-4 py-2 hover:bg-background-3"
        onClick={appendText}
      >
        Append Text
      </button>
    </div>
  );
}
