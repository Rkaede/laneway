import type { Mock } from 'bun:test';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createRoot } from 'solid-js';

const originalSelf = Object.getOwnPropertyDescriptor(globalThis, 'self');
Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const { createAudio } = await import('./use-audio');
const { apiKeys, setApiKeys } = await import('../store/keys');
const originalKey = apiKeys.openai;
const originalAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio');
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');

class TestAudio extends EventTarget {
  src = '';
  currentTime = 0;
  play = mock(async () => {});
  pause = mock(() => {});
}

let element: TestAudio;
let dispose: () => void;
const responses = new Map<string, Response>();
const cache = {
  match: mock(async (key: string) => responses.get(key)?.clone()),
  put: mock(async (key: string, response: Response) => {
    responses.set(key, response);
  }),
};
const openCache = mock(async () => cache);
let fetchSpeech: Mock<typeof fetch>;

function restoreGlobal(name: string, descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor);
  else Reflect.deleteProperty(globalThis, name);
}

function setup(text: string | (() => string) = '**Hello**') {
  return createRoot((cleanup) => {
    dispose = cleanup;
    return createAudio({ id: 'speech-test', text });
  });
}

beforeEach(() => {
  responses.clear();
  cache.match.mockClear();
  cache.put.mockClear();
  openCache.mockReset().mockResolvedValue(cache);
  element = new TestAudio();
  Object.defineProperty(globalThis, 'Audio', {
    configurable: true,
    value: function () {
      return element;
    },
  });
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: { open: openCache },
  });
  fetchSpeech = spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
  spyOn(console, 'error').mockImplementation(() => {});
  setApiKeys('openai', 'test-key');
});

afterEach(() => {
  dispose();
  mock.restore();
  restoreGlobal('Audio', originalAudio);
  restoreGlobal('caches', originalCaches);
  setApiKeys('openai', originalKey);
});

afterAll(() => restoreGlobal('self', originalSelf));

describe('createAudio', () => {
  it.each(['request', 'cache', 'playback'] as const)(
    'leaves loading after a %s failure and allows retry',
    async (failure) => {
      const audio = setup();
      if (failure === 'request') fetchSpeech.mockRejectedValueOnce(new Error('Offline'));
      if (failure === 'cache') openCache.mockRejectedValueOnce(new Error('Cache unavailable'));
      if (failure === 'playback')
        element.play.mockRejectedValueOnce(new Error('Playback blocked'));

      await audio.play();
      expect(audio.status()).toBe('error');
      expect(audio.ttsState.playingId).toBeNull();

      await audio.play();
      expect(audio.status()).toBe('playing');
      expect(audio.ttsState.playingId).toBe('speech-test');
    },
  );

  it('handles HTTP errors and retries after a key is corrected', async () => {
    const audio = setup();
    fetchSpeech.mockResolvedValueOnce(Response.json({ error: 'Invalid key' }, { status: 401 }));
    await audio.play();
    expect(audio.status()).toBe('error');
    await audio.play();
    expect(audio.status()).toBe('playing');
  });

  it('reads current content, advances through bounded chunks and stops at the end', async () => {
    let text = '';
    const audio = setup(() => text);
    text = '# Heading\n\n' + 'A sentence. '.repeat(500).trim();
    await audio.play();
    expect(audio.status()).toBe('playing');
    expect(fetchSpeech).toHaveBeenCalledTimes(1);

    element.dispatchEvent(new Event('ended'));
    for (let attempt = 0; attempt < 20 && audio.status() === 'loading'; attempt++)
      await Bun.sleep(1);
    expect(audio.status()).toBe('playing');
    expect(fetchSpeech).toHaveBeenCalledTimes(2);
    const inputs = fetchSpeech.mock.calls.map(
      ([, options]) => JSON.parse(options?.body as string).input as string,
    );
    expect(inputs.every((input) => input.length <= 4096)).toBe(true);
    expect(inputs.join(' ')).toBe(text.replace('# ', '').replace('\n\n', '\n'));

    element.dispatchEvent(new Event('ended'));
    expect(audio.status()).toBe('idle');
    expect(audio.ttsState.playingId).toBeNull();
  });

  it('handles asynchronous decoding errors and allows retry', async () => {
    const audio = setup();
    await audio.play();
    element.dispatchEvent(new Event('error'));
    expect(audio.status()).toBe('error');
    await audio.play();
    expect(audio.status()).toBe('playing');
  });

  it('does not play a request that completes after cleanup', async () => {
    const audio = setup();
    const pending = Promise.withResolvers<Response>();
    fetchSpeech.mockReturnValueOnce(pending.promise);
    const playing = audio.play();
    await Bun.sleep(0);
    dispose();
    pending.resolve(new Response(new Uint8Array([1, 2, 3])));
    await playing;
    expect(element.play).not.toHaveBeenCalled();
    expect(audio.status()).toBe('idle');
  });

  it('reuses cached audio and ignores duplicate clicks while loading or playing', async () => {
    const audio = setup();
    const playing = audio.play();
    await audio.play();
    await playing;
    await audio.play();
    expect(fetchSpeech).toHaveBeenCalledTimes(1);
    audio.stop();
    await audio.play();
    expect(fetchSpeech).toHaveBeenCalledTimes(1);
    expect(audio.status()).toBe('playing');
  });
});
