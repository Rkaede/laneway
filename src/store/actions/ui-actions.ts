import {
  IconInfo,
  IconPencilLine,
  IconSidebar,
  IconSun,
} from '~/components/icons/ui';
import type { Actions } from '~/types';
import { setStore, store } from '..';

export function toggleSidebar() {
  setStore('settings', 'sidebarOpen', (open) => !open);
}

export function showAboutDialog() {
  setStore('dialogs', 'about', 'open', true);
}

export const uiActions: Actions = {
  toggleSidebar: {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    keywords: ['sidebar', 'toggle'],
    shortcut: '$mod+D',
    icon: IconSidebar,
    fn: () => toggleSidebar(),
  },
  toggleTheme: {
    id: 'toggle-theme',
    name: 'Toggle Theme',
    keywords: ['theme', 'dark', 'light', 'mode'],
    icon: IconSun,
    fn: () => {
      const newTheme = store.settings.theme === 'dark' ? 'light' : 'dark';
      setStore('settings', 'theme', newTheme);
    },
  },
  showAbout: {
    id: 'show-about',
    name: 'About',
    keywords: ['about', 'info', 'version'],
    icon: IconInfo,
    fn: () => showAboutDialog(),
  },
  toggleAvatars: {
    id: 'toggle-avatars',
    name: 'Toggle Message Avatars',
    keywords: ['avatars', 'show', 'hide'],
    icon: IconSidebar,
    fn: () => {
      setStore('settings', 'messages', 'showAvatars', (showAvatars) => !showAvatars);
    },
  },
  toggleCompletions: {
    id: 'toggle-completions',
    name: 'Toggle Completions',
    keywords: ['completions', 'show', 'hide'],
    icon: IconPencilLine,
    fn: () => {
      setStore('settings', 'completions', 'enabled', (enabled) => !enabled);
    },
  },
} as const;
