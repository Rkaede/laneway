import { describe, expect, it } from 'bun:test';
import { createRoot } from 'solid-js';

import { validateAssistant, validatePreset } from '~/store/editor-validation';
import type { AssistantProps, PresetProps } from '~/types';

import { createTemplateEditor, fetchTemplateGallery } from './template-helpers';

describe('template gallery', () => {
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
