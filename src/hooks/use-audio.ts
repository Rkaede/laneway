import { createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

import { generateSpeech } from '~/services/tts/openai-tts';
import { store } from '~/store';
import { hash } from '~/util';

const TTS_CACHE_NAME = 'laneway-tts-cache';

type AudioStatus = 'idle' | 'loading' | 'playing' | 'error';

interface TTS {
  status: AudioStatus;
  playingId: string | null;
}

const [ttsState, setTtsState] = createStore<TTS>({
  status: 'idle',
  playingId: null,
});

export function createAudio({ id, text }: { id?: string; text?: string }) {
  const [status, setStatus] = createSignal<AudioStatus>('idle');
  const audio = new Audio();

  const handleAudioEnd = () => {
    setStatus('idle');
    setTtsState({ status: 'idle', playingId: null });
    URL.revokeObjectURL(audio.src);
  };

  createEffect(() => {
    if (ttsState.status === 'playing' && ttsState.playingId !== id) {
      audio.pause();
      audio.currentTime = 0;
      setStatus('idle');
    }
  });

  onCleanup(() => {
    audio.removeEventListener('ended', handleAudioEnd);
    audio.pause();
    URL.revokeObjectURL(audio.src);
    audio.src = '';
  });

  async function play(service: string = 'openai') {
    const voice = store.settings.tts.openai.voice ?? 'alloy';

    if (!text) return;
    audio.removeEventListener('ended', handleAudioEnd);

    const hashId = hash(text + service + voice);

    if (status() === 'playing') {
      audio.pause();
      audio.currentTime = 0;
    }

    let audioBuffer;
    const cache = await caches.open(TTS_CACHE_NAME);
    const cachedResponse = await cache.match(hashId.toString());

    if (cachedResponse) {
      audioBuffer = await cachedResponse.arrayBuffer();
    } else {
      setStatus('loading');
      audioBuffer = await generateSpeech(text, store.settings.tts.openai.voice);
      await cache.put(hashId.toString(), new Response(audioBuffer));
    }

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const data = URL.createObjectURL(blob);
    audio.src = data;

    audio
      .play()
      .then(() => {
        setStatus('playing');
        setTtsState({ status: 'playing', playingId: id });
      })
      .catch((error) => {
        setStatus('error');
        setTtsState({ status: 'error', playingId: null });
        console.error('Error playing audio:', error);
      });

    audio.addEventListener('ended', handleAudioEnd);
  }

  async function stop() {
    if (status() === 'playing') {
      try {
        await audio.pause();
        audio.currentTime = 0;
        setStatus('idle');
      } catch (error) {
        console.error('Error pausing audio:', error);
        setStatus('error');
      }
    }
  }

  return { play, stop, ttsState, status };
}
