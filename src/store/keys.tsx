import { createStore, reconcile } from 'solid-js/store';

import { clone } from '~/util';

import { removeLegacyGoogleKey } from './key-migrations';
import { makePersistedStore } from './persisted';

type APIKeys = {
  openai?: string;
  openrouter?: string;
  hasCompletedWelcome?: boolean;
};

const defaultState = {
  openai: '',
  openrouter: '',
  hasCompletedWelcome: false,
};

// the warning given by the rule here is not helpful in this case

export const [apiKeys, setApiKeys] = makePersistedStore(
  createStore<APIKeys>(clone(defaultState)),
  {
    name: 'laneway-api-keys',
  },
);

// migrations
if ('google' in apiKeys) {
  setApiKeys(reconcile(removeLegacyGoogleKey(apiKeys)));
}

export const deleteKeys = () => {
  setApiKeys(reconcile(clone(defaultState)));
};
