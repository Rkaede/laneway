import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as fs from 'fs';

import { generateModels, modelsBase } from './models';

afterEach(() => {
  mock.restore();
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
