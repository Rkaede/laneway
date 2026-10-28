import { createEffect } from 'solid-js';

import { getTheme, THEMES } from '~/constants';
import { store } from '~/store';

/**
 * Keeps the active theme class on <html> in sync with the theme setting. The class goes on
 * <html> so portalled overlays (dialogs, menus) inherit the tokens. Every top-level layout
 * calls this, because the app and the sandbox are separate routes.
 */
export function useApplyTheme() {
  createEffect(() => {
    const root = document.documentElement;
    const active = getTheme(store.settings.theme);
    root.classList.remove(...THEMES.map((theme) => theme.className));
    root.classList.add(active.className);
  });
}
