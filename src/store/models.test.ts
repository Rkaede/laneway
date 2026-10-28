import { afterEach, expect, it, mock, spyOn } from 'bun:test';

import type { ModelProps, ModelTags } from '~/types';

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { fetchModels, models, modelsByCreator, setModels } = await import('./models');
fetchMock.mockRestore();

afterEach(() => {
  mock.restore();
  setModels([]);
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

const model = (id: string, creator: string, deprecated = false): ModelProps => ({
  id,
  title: id,
  creator: { id: creator, name: creator, website: '', icon: creator },
  provider: [],
  created: 0,
  tags: [],
  deprecated,
});

it('loads the model catalogue', async () => {
  const catalogue = [model('openai/current', 'OpenAI')];
  const fetch = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(catalogue));

  await fetchModels();

  expect(fetch).toHaveBeenCalledWith('/models.json');
  expect(models).toEqual(catalogue);
});

it('removes the legacy catalogue without reading or writing model storage', async () => {
  const data = new Map([
    ['laneway-models', JSON.stringify([model('openai/legacy', 'OpenAI')])],
    ['laneway-store', 'saved chats'],
  ]);
  const storage = {
    getItem: mock((key: string) => data.get(key) ?? null),
    setItem: mock((key: string, value: string) => data.set(key, value)),
    removeItem: (key: string) => data.delete(key),
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  const catalogue = [model('openai/current', 'OpenAI')];
  spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(catalogue));

  await fetchModels();

  expect(models).toEqual(catalogue);
  expect(data).toEqual(new Map([['laneway-store', 'saved chats']]));
  expect(storage.getItem).not.toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it.each(['access', 'removal'])(
  'loads models when legacy storage %s is blocked',
  async (operation) => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        if (operation === 'access') throw new DOMException('Blocked', 'SecurityError');
        return {
          removeItem() {
            throw new DOMException('Blocked', 'SecurityError');
          },
        };
      },
    });
    const catalogue = [model('openai/current', 'OpenAI')];
    spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(catalogue));

    await fetchModels();

    expect(models).toEqual(catalogue);
  },
);

it.each([
  { created: '2026-10-01T00:00:00Z', isNew: true },
  { created: '2026-08-28T00:00:01Z', isNew: true },
  { created: '2026-08-28T00:00:00Z', isNew: false },
  { created: '2026-08-27T23:59:59Z', isNew: false },
])('refreshes new tags for a model created at $created', async ({ created, isNew }) => {
  spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-28T00:00:00Z'));
  const tags: ModelTags[] = ['vision', 'new', 'free'];
  const catalogue = [
    { ...model('openai/tagged', 'OpenAI'), created: Date.parse(created) / 1000, tags },
    {
      ...model('openai/untagged', 'OpenAI'),
      created: Date.parse(created) / 1000,
      tags: undefined,
    },
  ];
  spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(catalogue));

  await fetchModels();

  expect(models[0].created).toBe(catalogue[0].created);
  expect(models[0].tags).toEqual(isNew ? ['vision', 'free', 'new'] : ['vision', 'free']);
  expect(models[1].tags).toEqual(isNew ? ['new'] : []);
});

it('removes stale new tags from the cached catalogue when offline', async () => {
  spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-28T00:00:00Z'));
  const cached = { ...model('openai/cached', 'OpenAI'), tags: ['new', 'free'] as ModelTags[] };
  setModels([cached]);
  spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline'));
  spyOn(console, 'error').mockImplementation(() => {});

  await fetchModels();

  expect(models).toEqual([{ ...cached, tags: ['free'] }]);
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
