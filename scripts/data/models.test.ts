import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as fs from 'fs';

import { createDefaultState } from '../../src/store/default-state';
import { assistants } from './assistants';
import { generateModels, modelsBase } from './models';
import { presets } from './presets';

afterEach(() => {
  mock.restore();
});

describe('generateModels catalogue', () => {
  const routerModel = (id: string) => ({
    id,
    name: id,
    created: 1771342990,
    context_length: 128000,
    architecture: { input_modalities: ['text', 'image'] },
    pricing: { prompt: '0.000003', completion: '0.000015', image: '0', request: '0' },
    top_provider: { max_completion_tokens: 4096 },
  });

  beforeEach(() => {
    spyOn(fs, 'existsSync').mockReturnValue(false);
    spyOn(console, 'log').mockImplementation(() => {});
  });

  it('keeps missing and deprecated models for saved references and warns about them', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        data: [
          routerModel('openai/gpt-4o'),
          { ...routerModel('openai/gpt-4.1'), deprecated: true },
          routerModel('openai/o1-mini'),
          routerModel('other/uncurated'),
        ],
      }),
    );

    const models = (await generateModels()).filter((model) => model.id !== 'aperture/glados');

    expect(models.map((model) => model.id)).toEqual(
      modelsBase.filter((model) => model.id !== 'aperture/glados').map((model) => model.id),
    );
    expect(models.filter((model) => !model.deprecated).map((model) => model.id)).toEqual([
      'openai/gpt-4o',
    ]);
    for (const model of models.filter((model) => model.id !== 'openai/gpt-4o')) {
      expect(model).toMatchObject({
        ...modelsBase.find((base) => base.id === model.id),
        deprecated: true,
      });
      expect(console.log).toHaveBeenCalledWith('warning: model not on openrouter', model.id);
    }
    expect(models.find((model) => model.id === 'openai/gpt-4o')).toMatchObject({
      created: 1771342990,
      contextLength: 128000,
      maxCompletionTokens: 4096,
      vision: true,
      pricing: { prompt: 0.000003, completion: 0.000015, image: 0, request: 0 },
    });
  });

  it('resolves bundled presets, defaults and examples against available models', async () => {
    // OpenRouter IDs verified on 2026-10-28; no live API calls in unit tests.
    const availableIds = [
      'anthropic/claude-opus-4.1',
      'anthropic/claude-opus-4.6',
      'anthropic/claude-sonnet-4.5',
      'anthropic/claude-sonnet-4.6',
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'google/gemini-3.1-pro-preview',
      'openai/gpt-4.1',
      'openai/gpt-4.1-nano',
      'openai/gpt-4o',
      'openai/gpt-5',
      'openai/gpt-5-mini',
      'openai/gpt-5.4',
      'perplexity/sonar-reasoning-pro',
      'x-ai/grok-4.20',
      'x-ai/grok-4.20-multi-agent',
    ];
    spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ data: availableIds.map(routerModel) }),
    );

    const models = await generateModels();
    const generatedIds = new Set(
      models.filter((model) => !model.deprecated).map((model) => model.id),
    );
    const state = createDefaultState();
    const settings = state.settings;
    const references = [
      ...[...presets, ...state.presets].flatMap((preset) =>
        (preset.chats ?? []).map((chat) => chat.modelId),
      ),
      ...assistants.map((assistant) => assistant.modelId),
      ...[...state.chats, ...state.draftChats].map((chat) => chat.modelId),
      ...state.speedDial
        .filter((item) => item.type === 'model')
        .map((item) => item.referenceId),
      settings.systemModel,
      settings.noteModel.referenceId,
      settings.defaultSession.id,
      settings.completions.model,
    ];

    expect(references.filter((id) => !generatedIds.has(id))).toEqual([]);
    expect(generatedIds.has('x-ai/grok-4.20')).toBe(true);
    expect(generatedIds.has('x-ai/grok-4.20-multi-agent')).toBe(true);
  });
});

describe('generateModels vision detection', () => {
  it.each([
    {
      name: 'image inputs',
      architecture: { modality: 'text+image->text', input_modalities: ['text', 'image'] },
      vision: true,
    },
    {
      name: 'image and file inputs',
      architecture: {
        modality: 'text+image+file->text',
        input_modalities: ['text', 'image', 'file'],
      },
      vision: true,
    },
    {
      name: 'image, file, audio and video inputs in any order',
      architecture: {
        modality: 'text+image+file+audio+video->text',
        input_modalities: ['audio', 'file', 'image', 'text', 'video'],
      },
      vision: true,
    },
    {
      name: 'text-only inputs',
      architecture: { modality: 'text->text', input_modalities: ['text'] },
      vision: false,
    },
    {
      name: 'image outputs without image inputs',
      architecture: {
        modality: 'text->image',
        input_modalities: ['text'],
        output_modalities: ['image'],
      },
      vision: false,
    },
    {
      name: 'empty input modalities',
      architecture: { input_modalities: [] },
      vision: false,
    },
    {
      name: 'missing input modalities',
      architecture: { modality: 'text+image->text' },
      vision: false,
    },
    {
      name: 'missing architecture',
      architecture: undefined,
      vision: false,
    },
  ])('$name', async ({ architecture, vision }) => {
    spyOn(fs, 'existsSync').mockReturnValue(false);
    spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({
        data: modelsBase.map((model) => ({
          id: model.id,
          name: model.title,
          created: 0,
          architecture: model.id === 'openai/gpt-4o' ? architecture : {},
          pricing: { prompt: '1', completion: '1', image: '0', request: '0' },
          top_provider: { max_completion_tokens: 4096 },
        })),
      }),
    );

    const models = await generateModels();
    const model = models.find((model) => model.id === 'openai/gpt-4o');

    expect(model?.vision).toBe(vision);
    expect(model?.tags?.includes('vision')).toBe(vision);
  });
});
