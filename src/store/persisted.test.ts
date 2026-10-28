import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';

import { createDebouncedStorage, makePersistedStore } from './persisted';

const descriptors = ['localStorage', 'window', 'document'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
);
let data: Map<string, string>;
let writes: ReturnType<typeof mock<(key: string, value: string) => void>>;
let warnings: ReturnType<typeof spyOn<typeof console, 'warn'>>;
let dispose: () => void;

beforeEach(() => {
  data = new Map();
  writes = mock((key: string, value: string) => {
    data.set(key, value);
  });
  Object.defineProperties(globalThis, {
    localStorage: {
      configurable: true,
      value: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: writes,
        removeItem: (key: string) => data.delete(key),
      },
    },
    window: { configurable: true, value: new EventTarget() },
    document: { configurable: true, value: new EventTarget() },
  });
  warnings = spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  dispose();
  warnings.mockRestore();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

function setup<T>(create: () => T) {
  return createRoot((cleanup) => {
    dispose = cleanup;
    return create();
  });
}

describe('debounced persistence', () => {
  it('coalesces rapid store updates and writes the trailing value', async () => {
    const [state, set] = setup(() =>
      makePersistedStore(createStore({ text: '' }), { name: 'chat' }),
    );
    for (let token = 0; token < 200; token++) set('text', `Token ${token}`);
    expect(state.text).toBe('Token 199');
    expect(writes).not.toHaveBeenCalled();
    await Bun.sleep(150);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(JSON.parse(data.get('chat')!).text).toBe('Token 199');
  });

  it('checkpoints continuous updates within the maximum wait', async () => {
    const storage = setup(createDebouncedStorage);
    for (let token = 0; token < 9; token++) {
      storage.setItem('chat', `Token ${token}`);
      await Bun.sleep(60);
    }
    expect(writes).toHaveBeenCalledTimes(1);
    expect(data.get('chat')).toMatch(/^Token \d+$/);
    window.dispatchEvent(new Event('pagehide'));
    expect(data.get('chat')).toBe('Token 8');
  });

  it('contains quota errors, warns once and keeps the pending value for a retry', () => {
    const storage = setup(createDebouncedStorage);
    writes.mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    storage.setItem('chat', 'Partial');
    expect(() => window.dispatchEvent(new Event('pagehide'))).not.toThrow();
    window.dispatchEvent(new Event('pagehide'));
    expect(warnings).toHaveBeenCalledTimes(1);
    expect(storage.getItem('chat')).toBe('Partial');
    writes.mockImplementation((key, value) => {
      data.set(key, value);
    });
    window.dispatchEvent(new Event('pagehide'));
    expect(data.get('chat')).toBe('Partial');
  });

  it('flushes synchronously on pagehide and when the page becomes hidden', () => {
    const storage = setup(createDebouncedStorage);
    storage.setItem('chat', 'Before reload');
    window.dispatchEvent(new Event('pagehide'));
    expect(data.get('chat')).toBe('Before reload');
    storage.setItem('chat', 'Before hiding');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(data.get('chat')).toBe('Before hiding');
  });

  it('reads pending values before disk and cancels pending writes on removal', async () => {
    data.set('chat', 'Saved');
    const storage = setup(createDebouncedStorage);
    expect(storage.getItem('chat')).toBe('Saved');
    storage.setItem('chat', 'Pending');
    expect(storage.getItem('chat')).toBe('Pending');
    expect(data.get('chat')).toBe('Saved');
    storage.removeItem('chat');
    await Bun.sleep(150);
    expect(storage.getItem('chat')).toBeNull();
    expect(data.has('chat')).toBe(false);
    expect(writes).not.toHaveBeenCalled();
  });
});
