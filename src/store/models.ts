import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import type { ModelProps } from '~/types';

// NOTE: we're moving data to be external from the application code
// - This is a test to see if it improves performance. We'll need to test this and look at
//   improvements such as caching via PWA.
// - It moves the model data formatting code to be run at build time.
// - It also moves us in the direction of managing a config of
//   models/providers/assistant/presets external of the app itself.
// - The data, such as prices will still not be "live". We'll address this later.
// export const models = (await fetch('/models.json').then((res) => res.json())) as ModelProps[];

function fetchModels() {
  return fetch('/models.json').then((res) => res.json());
}

// the warning given by the rule here is not helpful in this case
// eslint-disable-next-line solid/reactivity
export const [models, setModels] = makePersisted(createStore<ModelProps[]>([]), {
  name: 'laneway-models',
});

fetchModels().then((models) => {
  setModels(models);
});

export const providers = {
  openai: 'OpenAI',
  google: 'Google',
  openrouter: 'OpenRouter',
};

export const modelsByCreator = () =>
  models.reduce(
    (acc, model) => {
      const group = acc.find((g) => g.title === model.creator?.name);
      if (!group) {
        acc.push({ title: model.creator.name, models: [model] });
      } else {
        group.models.push(model);
      }
      return acc;
    },
    [] as { title: string; models: ModelProps[] }[],
  );
