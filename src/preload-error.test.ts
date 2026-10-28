import { describe, expect, it, mock, spyOn } from 'bun:test';

import { registerPreloadErrorHandler } from './preload-error';

function createTarget(storage = new Map<string, string>()) {
  return Object.assign(new EventTarget(), {
    location: { reload: mock(() => {}) },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    },
  });
}

function dispatchPreloadError(target: EventTarget) {
  const event = new Event('vite:preloadError', { cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('registerPreloadErrorHandler', () => {
  const entryUrl = 'https://laneway.app/assets/index-old.js';

  it('reloads the current page and suppresses the failed lazy import', () => {
    const target = createTarget();
    registerPreloadErrorHandler(target, entryUrl);

    expect(dispatchPreloadError(target).defaultPrevented).toBe(true);
    expect(target.location.reload).toHaveBeenCalledTimes(1);

    dispatchPreloadError(target);
    expect(target.location.reload).toHaveBeenCalledTimes(1);
  });

  it('preserves the original error if the same build still fails after a reload', () => {
    const storage = new Map<string, string>();
    const original = createTarget(storage);
    registerPreloadErrorHandler(original, entryUrl);
    dispatchPreloadError(original);

    const reloaded = createTarget(storage);
    registerPreloadErrorHandler(reloaded, entryUrl);

    expect(dispatchPreloadError(reloaded).defaultPrevented).toBe(false);
    expect(reloaded.location.reload).not.toHaveBeenCalled();
  });

  it('allows recovery again when a newer build fails', () => {
    const storage = new Map<string, string>();
    const original = createTarget(storage);
    registerPreloadErrorHandler(original, entryUrl);
    dispatchPreloadError(original);

    const updated = createTarget(storage);
    registerPreloadErrorHandler(updated, 'https://laneway.app/assets/index-new.js');

    expect(dispatchPreloadError(updated).defaultPrevented).toBe(true);
    expect(updated.location.reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload for unrelated errors', () => {
    const target = createTarget();
    registerPreloadErrorHandler(target, entryUrl);
    const event = new Event('error', { cancelable: true });

    target.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(target.location.reload).not.toHaveBeenCalled();
  });

  it.each(['getItem', 'setItem'] as const)(
    'preserves the original error if storage %s fails',
    (method) => {
      const target = createTarget();
      spyOn(target.sessionStorage, method).mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      registerPreloadErrorHandler(target, entryUrl);

      expect(dispatchPreloadError(target).defaultPrevented).toBe(false);
      expect(target.location.reload).not.toHaveBeenCalled();
    },
  );

  it('preserves the original error if session storage access is denied', () => {
    const target = createTarget();
    Object.defineProperty(target, 'sessionStorage', {
      get() {
        throw new Error('Storage access denied');
      },
    });
    registerPreloadErrorHandler(target, entryUrl);

    expect(dispatchPreloadError(target).defaultPrevented).toBe(false);
    expect(target.location.reload).not.toHaveBeenCalled();
  });
});
