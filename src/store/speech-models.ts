import { createSignal } from 'solid-js';

import type { SpeechModel } from '~/types';

const [speechModels, setSpeechModels] = createSignal<SpeechModel[]>();
let loading: Promise<void> | undefined;

/** Loads the speech model catalogue once. Only the TTS settings need it. */
export function loadSpeechModels() {
  loading ??= fetch('/speech-models.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((catalogue: SpeechModel[]) => {
      setSpeechModels(catalogue);
    })
    .catch((error) => {
      loading = undefined;
      console.error('Error loading speech models:', error);
    });
  return loading;
}

export { speechModels };
