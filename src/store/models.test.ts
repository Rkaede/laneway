import { afterEach, expect, it, spyOn } from 'bun:test';

import type { ModelProps } from '~/types';

const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { models, modelsByCreator, setModels } = await import('./models');
fetchMock.mockRestore();

afterEach(() => {
  setModels([]);
});

it('keeps deprecated models for lookup while excluding them from model choices', () => {
  const model = (id: string, creator: string, deprecated = false): ModelProps => ({
    id,
    title: id,
    creator: { id: creator, name: creator, website: '', icon: creator },
    provider: [],
    created: 0,
    deprecated,
  });
  const active = model('openai/current', 'OpenAI');
  const retired = model('openai/retired', 'OpenAI', true);
  const retiredCreator = model('anthropic/retired', 'Anthropic', true);
  const anotherActive = model('openai/another', 'OpenAI');
  setModels([active, retired, retiredCreator, anotherActive]);

  expect(modelsByCreator()).toEqual([{ title: 'OpenAI', models: [active, anotherActive] }]);
  expect(models).toHaveLength(4);
  expect(models.find((model) => model.id === retired.id)).toMatchObject({
    title: retired.title,
    creator: { icon: 'OpenAI' },
    deprecated: true,
  });
  expect(models.find((model) => model.id === retiredCreator.id)).toMatchObject({
    title: retiredCreator.title,
    creator: { icon: 'Anthropic' },
    deprecated: true,
  });
});
