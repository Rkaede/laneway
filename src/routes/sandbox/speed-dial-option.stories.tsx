import { For } from 'solid-js';

import { SpeedDialOption } from '~/components/connected';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

export function Default() {
  return (
    <div class="flex gap-4">
      <SpeedDialOption title="GPT-6.1 Terra" tags={['model']} models={[MODEL_IDS.openai]} />
      <SpeedDialOption title="Sonnet 5.5" tags={['model']} models={[MODEL_IDS.anthropic]} />
    </div>
  );
}

export function WithSubtitle() {
  return (
    <div class="flex gap-4">
      <SpeedDialOption
        title="Code Reviewer"
        subtitle="Finds bugs before they ship"
        showSubtitle
        tags={['assistant']}
        models={[MODEL_IDS.anthropic]}
      />
      <SpeedDialOption
        title="Hidden subtitle"
        subtitle="Not shown without showSubtitle"
        tags={['assistant']}
      />
    </div>
  );
}

export function MultipleModels() {
  return (
    <div class="flex gap-4">
      <SpeedDialOption
        title="Flagship models"
        subtitle="Compare the best of each provider"
        showSubtitle
        tags={['preset']}
        models={[MODEL_IDS.openai, MODEL_IDS.anthropic, MODEL_IDS.google]}
      />
    </div>
  );
}

export function Tags() {
  return (
    <Cells class="grid-cols-4">
      <For each={['model', 'assistant', 'preset', 'online', 'note', 'free', 'new']}>
        {(tag) => (
          <Cell>
            <CellHeader>{tag}</CellHeader>
            <SpeedDialOption title={tag} tags={[tag]} />
          </Cell>
        )}
      </For>
      <Cell>
        <CellHeader>Several</CellHeader>
        <SpeedDialOption title="Several" tags={['model', 'online', 'note']} />
      </Cell>
    </Cells>
  );
}

export function LongTitle() {
  return (
    <SpeedDialOption
      class="self-start"
      title="A very long title that does not fit on a single line of the card"
      tags={['model']}
      models={[MODEL_IDS.openai]}
    />
  );
}
