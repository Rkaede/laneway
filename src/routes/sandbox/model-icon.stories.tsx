import { For } from 'solid-js';

import { ModelIcon } from '~/components/connected';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

const byCreator = [
  ['OpenAI', MODEL_IDS.openai],
  ['Anthropic', MODEL_IDS.anthropic],
  ['Google (a model icon)', MODEL_IDS.google],
  ['Microsoft', 'microsoft/phi-4'],
  ['Perplexity', MODEL_IDS.search],
  ['DeepSeek', 'deepseek/deepseek-v4.1-flash'],
  ['xAI', 'x-ai/grok-4.20'],
  ['Aperture', MODEL_IDS.free],
  ['Unknown model', 'nobody/not-a-model'],
] as const;

export function Icons() {
  return (
    <Cells class="grid-cols-3">
      <For each={byCreator}>
        {([label, modelId]) => (
          <Cell>
            <CellHeader>{label}</CellHeader>
            <ModelIcon modelId={modelId} class="size-6" />
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function Sizes() {
  return (
    <div class="flex items-center gap-4">
      <ModelIcon modelId={MODEL_IDS.anthropic} class="size-4" />
      <ModelIcon modelId={MODEL_IDS.anthropic} class="size-6" />
      <ModelIcon modelId={MODEL_IDS.anthropic} class="size-10" />
    </div>
  );
}
