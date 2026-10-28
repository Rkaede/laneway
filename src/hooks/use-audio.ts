import { createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

import { generateSpeech } from '~/services/tts/openai-tts';
import { speechChunks } from '~/services/tts/speech-text';
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

let sharedAudio: HTMLAudioElement | undefined;
let stopActive: (() => void) | undefined;

export function createAudio({ id, text }: { id?: string; text?: string | (() => string) }) {
  const [status, setStatus] = createSignal<AudioStatus>('idle');
  let audio: HTMLAudioElement | undefined;
  let chunks: string[] = [];
  let chunkIndex = 0;
  let playback = 0;

  const handleAudioEnd = () => {
    if (status() !== 'playing') return;
    if (++chunkIndex < chunks.length) {
      void playChunk(playback);
    } else {
      stop();
    }
  };

  const handleAudioError = (error: unknown) => {
    stop();
    setStatus('error');
    console.error('Error playing audio:', error);
  };

  onCleanup(stop);

  async function playChunk(currentPlayback: number) {
    const player = audio;
    if (!player) return;
    const voice = store.settings.tts.openai.voice ?? 'alloy';
    const content = chunks[chunkIndex];
    setStatus('loading');
    setTtsState({ status: 'loading', playingId: id ?? null });

    try {
      const hashId = hash(content + 'openai' + voice).toString();
      const cache =
        typeof caches === 'undefined' ? undefined : await caches.open(TTS_CACHE_NAME);
      const cachedResponse = await cache?.match(hashId);
      let audioBuffer;
      if (cachedResponse) {
        audioBuffer = await cachedResponse.arrayBuffer();
      } else {
        audioBuffer = await generateSpeech(content, voice);
        await cache?.put(hashId, new Response(audioBuffer));
      }
      if (currentPlayback !== playback) return;
      URL.revokeObjectURL(player.src);
      player.src = URL.createObjectURL(new Blob([audioBuffer], { type: 'audio/mpeg' }));
      await player.play();
      if (currentPlayback !== playback) return;
      setStatus('playing');
      setTtsState({ status: 'playing', playingId: id ?? null });
    } catch (error) {
      if (currentPlayback === playback) handleAudioError(error);
    }
  }

  async function play() {
    if (status() === 'loading' || status() === 'playing') return;
    chunks = speechChunks(typeof text === 'function' ? text() : (text ?? ''));
    if (!chunks.length) return;
    stopActive?.();
    audio = sharedAudio ??= new Audio();
    audio.addEventListener('ended', handleAudioEnd);
    audio.addEventListener('error', handleAudioError);
    stopActive = stop;
    chunkIndex = 0;
    await playChunk(++playback);
  }

  function stop() {
    playback++;
    setStatus('idle');
    if (stopActive !== stop || !audio) return;
    stopActive = undefined;
    audio.removeEventListener('ended', handleAudioEnd);
    audio.removeEventListener('error', handleAudioError);
    audio.pause();
    audio.currentTime = 0;
    URL.revokeObjectURL(audio.src);
    audio.src = '';
    audio = undefined;
    setTtsState({ status: 'idle', playingId: null });
  }

  return { play, stop, ttsState, status };
}
