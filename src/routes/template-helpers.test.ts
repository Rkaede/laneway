import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createRoot } from 'solid-js';

import { validateAssistant, validatePreset } from '~/store/editor-validation';
import type { AssistantProps, PresetProps } from '~/types';

import {
  createTemplateEditor,
  fetchTemplateGallery,
  loadTemplateGallery,
  matchesTemplateSearch,
} from './template-helpers';

describe('template gallery', () => {
  afterEach(() => mock.restore());

  it.each(['/assistants.json', '/presets.json'])('loads %s', async (path) => {
    const templates = [{ id: 'template' }];
    const result = await fetchTemplateGallery(path, async (requestedPath) => {
      expect(requestedPath).toBe(path);
      return Response.json(templates);
    });

    expect(result).toEqual(templates);
  });

  it('propagates a fetch failure to the resource', async () => {
    const error = new Error('Offline');
    await expect(
      fetchTemplateGallery('/assistants.json', () => Promise.reject(error)),
    ).rejects.toBe(error);
  });

  it('propagates invalid gallery JSON', async () => {
    await expect(
      fetchTemplateGallery('/presets.json', async () => new Response('invalid JSON')),
    ).rejects.toBeInstanceOf(SyntaxError);
  });

  it('rejects an HTTP error instead of reading its body as a gallery', async () => {
    await expect(
      fetchTemplateGallery('/presets.json', async () =>
        Response.json({ error: 'Not found' }, { status: 404 }),
      ),
    ).rejects.toThrow('/presets.json responded with HTTP 404.');
  });

  it.each<[string, () => Promise<Response>]>([
    ['a network failure', () => Promise.reject(new Error('Offline'))],
    ['an HTTP error', async () => new Response('Not found', { status: 404 })],
    ['a page served in place of the JSON', async () => new Response('<!doctype html>')],
  ])('logs %s and loads an empty gallery for the page', async (_name, fetcher) => {
    const logged = spyOn(console, 'error').mockImplementation(() => {});

    expect(await loadTemplateGallery('/assistants.json', fetcher)).toEqual([]);
    expect(logged).toHaveBeenCalledTimes(1);
    expect(logged.mock.calls[0][0]).toContain('/assistants.json');
  });

  it('keeps one gallery when the other fails to load', async () => {
    spyOn(console, 'error').mockImplementation(() => {});
    const templates = [{ id: 'template' }];

    const [presets, assistants] = await Promise.all([
      loadTemplateGallery('/presets.json', async () => Response.json(templates)),
      loadTemplateGallery('/assistants.json', () => Promise.reject(new Error('Offline'))),
    ]);

    expect(presets).toEqual(templates);
    expect(assistants).toEqual([]);
  });
});

describe('template search', () => {
  it('lists an untitled item until a search is entered', () => {
    expect(matchesTemplateSearch(undefined, '')).toBe(true);
    expect(matchesTemplateSearch(undefined, 'team')).toBe(false);
  });

  it('matches titles whatever the case', () => {
    expect(matchesTemplateSearch('Daily Driver', 'DRIVER')).toBe(true);
    expect(matchesTemplateSearch('Daily Driver', 'writer')).toBe(false);
  });
});

describe('template editor', () => {
  it('isolates nested edits from the saved template and detects reverted changes', () => {
    createRoot((dispose) => {
      const initial: PresetProps = {
        id: 'preset',
        type: 'chat',
        presetTitle: 'Team',
        chats: [{ modelId: 'original', status: 'idle' }],
      };
      const editor = createTemplateEditor({
        initialValue: () => initial,
        validate: (preset) => validatePreset(preset, []),
        onDirtyChange: () => {},
        onSave: () => {},
      });

      expect(editor.hasChanges()).toBe(false);
      editor.setValue('chats', 0, 'modelId', 'edited');
      expect(initial.chats[0].modelId).toBe('original');
      expect(editor.hasChanges()).toBe(true);

      editor.setValue('chats', 0, 'modelId', 'original');
      expect(editor.hasChanges()).toBe(false);
      dispose();
    });
  });

  it('revalidates the draft before saving an assistant', () => {
    createRoot((dispose) => {
      const initial: AssistantProps = { id: 'assistant', title: 'Helper', modelId: '' };
      const saved: AssistantProps[] = [];
      const editor = createTemplateEditor({
        initialValue: () => initial,
        validate: (assistant) => validateAssistant(assistant, []),
        onDirtyChange: () => {},
        onSave: (assistant) => saved.push({ ...assistant }),
      });

      expect(editor.validationError()).toBe('Select a model.');
      editor.save();
      expect(saved).toEqual([]);

      editor.setValue('modelId', 'openai/gpt-4o');
      expect(editor.validationError()).toBeUndefined();
      editor.save();
      expect(saved).toEqual([{ ...initial, modelId: 'openai/gpt-4o' }]);
      expect(initial.modelId).toBe('');

      editor.setValue('title', ' ');
      editor.save();
      expect(saved).toHaveLength(1);
      dispose();
    });
  });

  it('uses current collection validation when saving a preset', () => {
    createRoot((dispose) => {
      const initial: PresetProps = {
        id: 'preset',
        type: 'chat',
        presetTitle: 'Team',
        chats: [],
      };
      const presets: PresetProps[] = [];
      const saved: PresetProps[] = [];
      const editor = createTemplateEditor({
        initialValue: () => initial,
        validate: (preset) => validatePreset(preset, presets),
        onDirtyChange: () => {},
        onSave: (preset) => saved.push({ ...preset }),
      });

      editor.setValue('presetTitle', 'Renamed');
      expect(editor.validationError()).toBeUndefined();
      presets.push({ ...initial, id: 'other', presetTitle: 'Renamed' });
      editor.save();
      expect(saved).toEqual([]);

      editor.setValue('presetTitle', 'Unique');
      editor.save();
      expect(saved).toEqual([{ ...initial, presetTitle: 'Unique' }]);
      dispose();
    });
  });
});
