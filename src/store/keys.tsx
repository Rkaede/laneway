import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import { clone } from '~/util';

type APIKeys = {
  openai?: string;
  google?: string;
  openrouter?: string;
};

const defaultState = {
  openai: undefined,
  google: undefined,
  openrouter: undefined,
};

// the warning given by the rule here is not helpful in this case
// eslint-disable-next-line solid/reactivity
export const [apiKeys, setApiKeys] = makePersisted(createStore<APIKeys>(clone(defaultState)), {
  name: 'laneway-api-keys',
});

export const deleteKeys = () => {
  setApiKeys(clone(defaultState));
};
