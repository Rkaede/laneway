import { afterEach, expect, it, mock, spyOn } from 'bun:test';

import type { ModelProps } from '~/types';

const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { fetchModels, models, modelsByCreator, setModels } = await import('./models');
fetchMock.mockRestore();

afterEach(() => {
  mock.restore();
  setModels([]);
});

const model = (id: string, creator: string, deprecated = false): ModelProps => ({
  id,
  title: id,
  creator: { id: creator, name: creator, website: '', icon: creator },
  provider: [],
  created: 0,
  deprecated,
});

it('loads the model catalogue', async () => {
  const catalogue = [model('openai/current', 'OpenAI')];
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(catalogue));

  await fetchModels();

  expect(fetch).toHaveBeenCalledWith('/models.json');
  expect(models).toEqual(catalogue);
});

it.each(['network', 'HTTP', 'JSON'])(
  'handles %s errors and keeps the cached catalogue',
  async (failure) => {
    const cached = [model('openai/cached', 'OpenAI')];
    setModels(cached);
    const fetch = spyOn(globalThis, 'fetch');
    if (failure === 'network') fetch.mockRejectedValue(new Error('Offline'));
    else if (failure === 'HTTP') fetch.mockResolvedValue(Response.json([], { status: 404 }));
    else fetch.mockResolvedValue(new Response('{'));
    const error = spyOn(console, 'error').mockImplementation(() => {});

    await expect(fetchModels()).resolves.toBeUndefined();

    expect(models).toEqual(cached);
    expect(error).toHaveBeenCalledWith('Error loading models:', expect.any(Error));
  },
);

it('handles a failed load without a cached catalogue', async () => {
  spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
  const error = spyOn(console, 'error').mockImplementation(() => {});

  await expect(fetchModels()).resolves.toBeUndefined();

  expect(models).toEqual([]);
  expect(error).toHaveBeenCalledWith('Error loading models:', expect.any(Error));
});

it('keeps deprecated models for lookup while excluding them from model choices', () => {
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
