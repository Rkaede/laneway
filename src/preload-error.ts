interface PreloadErrorTarget extends EventTarget {
  readonly sessionStorage: Pick<Storage, 'getItem' | 'setItem'>;
  readonly location: Pick<Location, 'reload'>;
}

export function registerPreloadErrorHandler(target: PreloadErrorTarget, entryUrl: string) {
  target.addEventListener('vite:preloadError', (event) => {
    // Remember the failed build across reloads to avoid a refresh loop.
    const key = 'laneway-preload-reload';
    try {
      if (target.sessionStorage.getItem(key) === entryUrl) return;
      target.sessionStorage.setItem(key, entryUrl);
    } catch {
      return;
    }

    event.preventDefault();
    target.location.reload();
  });
}
