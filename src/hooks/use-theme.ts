import { createEffect, onCleanup } from 'solid-js';

import { getTheme, THEMES } from '~/constants';
import { store } from '~/store';

export function applyTheme(id: string, root: HTMLElement, preference: MediaQueryList) {
  const theme = getTheme(id);
  const apply = () => {
    const active =
      theme.id === 'system' ? getTheme(preference.matches ? 'dark' : 'light') : theme;
    root.classList.remove(...THEMES.map((theme) => theme.className));
    root.classList.add(active.className);
    root.style.colorScheme = active.scheme;
  };

  apply();
  preference.addEventListener('change', apply);
  return () => preference.removeEventListener('change', apply);
}

/**
 * Keeps the active theme class on <html> in sync with the theme setting. The class goes on
 * <html> so portalled overlays (dialogs, menus) inherit the tokens. Every top-level layout
 * calls this, because the app and the sandbox are separate routes.
 */
export function useApplyTheme() {
  createEffect(() => {
    onCleanup(
      applyTheme(
        store.settings.theme,
        document.documentElement,
        window.matchMedia('(prefers-color-scheme: dark)'),
      ),
    );
  });
}
