import {
  IconBox,
  IconFileSliders,
  IconLayoutGrid,
  IconListRestart,
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
    icon: IconBox,
    fn: (context: ActionContext) => {
      context.navigate('/assistants');
    },
  },
  viewModels: {
    id: 'view-models',
    name: 'View Models',
    keywords: [],
    icon: IconFileSliders,
    fn: (context: ActionContext) => {
      context.navigate('/models');
    },
  },
  gotoLatest: {
    id: 'goto-latest',
    name: 'Latest Session',
    keywords: ['navigate', 'latest'],
    icon: IconListRestart,
    fn: (context: ActionContext) => {
      if (store.sessions.length === 0) return;
      const latest = store.sessions.sort((a, b) => b.created - a.created)[0];
      context.navigate(`/session/${latest.id}`);
    },
  },
} as const;
