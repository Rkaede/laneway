import { createStore } from 'solid-js/store';

import type { ModelProps, ModelTags } from '~/types';

// NOTE: we're moving data to be external from the application code
// - This is a test to see if it improves performance. We'll need to test this and look at
//   improvements such as caching via PWA.
// - It moves the model data formatting code to be run at build time.
// - It also moves us in the direction of managing a config of
//   models/providers/assistant/presets external of the app itself.
// - The data, such as prices will still not be "live". We'll address this later.
// export const models = (await fetch('/models.json').then((res) => res.json())) as ModelProps[];

export async function fetchModels() {
  try {
    globalThis.localStorage?.removeItem('laneway-models');
  } catch {
    // Storage may be unavailable; the catalogue only needs to stay in memory.
  }

  try {
    const res = await fetch('/models.json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setModels(await res.json());
  } catch (error) {
    console.error('Error loading models:', error);
  }

  // Check if the model is less than 2 months old
  const twoMonthsAgo = new Date(Date.now());
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  setModels((catalogue) =>
    catalogue.map((model) => {
      const tags: ModelTags[] = model.tags?.filter((tag) => tag !== 'new') ?? [];
      if (new Date(model.created * 1000) > twoMonthsAgo) {
        tags.push('new');
      }
      return { ...model, tags };
    }),
  );
}

export const [models, setModels] = createStore<ModelProps[]>([]);

fetchModels();

export const providers = {
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
};

export const modelsByCreator = () =>
  models.reduce(
    (acc, model) => {
      if (model.deprecated) return acc;
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
