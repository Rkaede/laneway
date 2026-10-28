import {
  IconBox,
  IconLayoutGrid,
  IconListRestart,
  IconScanFace,
  IconSettings,
} from '~/components/icons/ui';
import type { ActionContext, Actions } from '~/types';

import { store } from '..';

export const navigationActions: Actions = {
  settings: {
    id: 'settings',
    name: 'Settings',
    keywords: ['settings'],
    icon: IconSettings,
    fn: (context: ActionContext) => {
      context.navigate('/settings');
    },
  },
  editPresets: {
    id: 'edit-presets',
    name: 'Edit Presets',
    keywords: ['presets'],
    icon: IconLayoutGrid,
    fn: (context: ActionContext) => {
      context.navigate('/presets');
    },
  },
  editAssistants: {
    id: 'edit-assistants',
    name: 'Edit Assistants',
    keywords: [],
    icon: IconScanFace,
    fn: (context: ActionContext) => {
      context.navigate('/assistants');
    },
  },
  viewModels: {
    id: 'view-models',
    name: 'View Models',
    keywords: [],
    icon: IconBox,
    fn: (context: ActionContext) => {
      context.navigate('/models');
    },
  },
  gotoLatest: {
    id: 'goto-latest',
    name: 'Latest Chat or Note',
    keywords: ['navigate', 'latest'],
    icon: IconListRestart,
    available: () => store.sessions.length > 0,
    fn: (context: ActionContext) => {
      if (store.sessions.length === 0) return;
      const latest = [...store.sessions].sort((a, b) => b.created - a.created)[0];
      context.navigate(`/session/${latest.id}`);
    },
  },
} as const;
