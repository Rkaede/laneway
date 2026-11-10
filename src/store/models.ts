import { createStore } from 'solid-js/store';

import type { ModelProps, ModelTags } from '~/types';

/** Tags models less than two months old as new, and drops the tag from older ones. */
function tagNewModels(catalogue: ModelProps[]) {
  const twoMonthsAgo = new Date(Date.now());
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return catalogue.map((model) => {
    const tags: ModelTags[] = model.tags?.filter((tag) => tag !== 'new') ?? [];
    if (new Date(model.created * 1000) > twoMonthsAgo) {
      tags.push('new');
    }
    return { ...model, tags };
  });
}

export async function fetchModels() {
  try {
    globalThis.localStorage?.removeItem('laneway-models');
  } catch {
    // Storage may be unavailable; the catalogue only needs to stay in memory.
  }

  try {
    const res = await fetch('/models.json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setModels(tagNewModels(await res.json()));
  } catch (error) {
    console.error('Error loading models:', error);
    // The catalogue already in memory stays, but its tags may have gone stale.
    setModels(tagNewModels);
  }
}

export const [models, setModels] = createStore<ModelProps[]>([]);

/** Until this is true, a model that does not resolve says nothing about the model or its key. */
export const modelsLoaded = () => models.length > 0;

fetchModels();

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
