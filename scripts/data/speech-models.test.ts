import { expect, it } from 'bun:test';

import { toSpeechModels } from './speech-models';

const model = (id: string, extra: object = {}) => ({
  id,
  name: id,
  pricing: { prompt: '0.00000062' },
  supported_voices: ['voice'],
  ...extra,
});

it('keeps models Laneway can play, sorted by title, with a per-character price', () => {
  const result = toSpeechModels({
    data: [
      model('hexgrad/kokoro-82m', { name: 'Kokoro' }),
      model('deepgram/aura-2', { name: 'Aura', pricing: { prompt: '0.00003' } }),
    ],
  });

  expect(result).toEqual([
    { id: 'deepgram/aura-2', title: 'Aura', voices: ['voice'], price: 0.00003 },
    { id: 'hexgrad/kokoro-82m', title: 'Kokoro', voices: ['voice'], price: 0.00000062 },
  ]);
});

it('drops models without voices, PCM-only models and expired models', () => {
  const result = toSpeechModels({
    data: [
      model('fish-audio/s1', { supported_voices: [] }),
      model('bytedance-seed/seed-audio-1-0', { supported_voices: null }),
      model('heygen/heygen-voice-1'),
      model('google/gemini-3.8-flash-tts'),
      model('old/model', { expiration_date: '2000-01-01' }),
      model('hexgrad/kokoro-82m'),
    ],
  });

  expect(result.map((m) => m.id)).toEqual(['hexgrad/kokoro-82m']);
});
