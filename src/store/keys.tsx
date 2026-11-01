import { createStore, reconcile } from 'solid-js/store';

import { clone } from '~/util';

import { removeLegacyKeys } from './key-migrations';
import { makePersistedStore } from './persisted';

type APIKeys = {
  openrouter?: string;
  /** Set when an old OpenAI key was dropped, so the key prompt can explain the change. */
  openaiKeyRemoved?: boolean;
};

const defaultState = {
  openrouter: '',
};

export const [apiKeys, setApiKeys] = makePersistedStore(
  createStore<APIKeys>(clone(defaultState)),
  {
    name: 'laneway-api-keys',
  },
);

// migrations
if (['google', 'openai', 'hasCompletedWelcome'].some((field) => field in apiKeys)) {
  setApiKeys(reconcile(removeLegacyKeys(apiKeys)));
}

export const setApiKey = (value: string) => {
  setApiKeys('openrouter', value.trim());
};

export const deleteKeys = () => {
  setApiKeys(reconcile(clone(defaultState)));
};
