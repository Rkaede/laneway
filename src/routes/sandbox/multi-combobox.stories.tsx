import { createSignal } from 'solid-js';

import { MultiCombobox } from '~/components/connected/multi-combobox';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

type Selection = { id?: string; type: 'assistant' | 'model' | 'preset' };

function Example(props: {
  initial?: Selection;
  includeModels?: boolean;
  includeAssistants?: boolean;
  includePresets?: boolean;
  showType?: boolean;
}) {
  // oxlint-disable-next-line solid/reactivity -- Only the first value is used.
  const [value, setValue] = createSignal(props.initial);

  return (
    <MultiCombobox
      value={value()}
      onSelect={({ referenceId, type }) => setValue({ id: referenceId, type })}
      includeModels={props.includeModels}
      includeAssistants={props.includeAssistants}
      includePresets={props.includePresets}
      showType={props.showType}
    />
  );
}

export function Basic() {
  return (
    <div class="w-72">
      <Example
        initial={{ type: 'model', id: MODEL_IDS.openai }}
        includeAssistants
        includeModels
      />
    </div>
  );
}

export function Selection() {
  return (
    <Cells class="max-w-xs">
      <Cell>
        <CellHeader>Nothing selected</CellHeader>
        <Example includeModels />
      </Cell>
      <Cell>
        <CellHeader>Model</CellHeader>
        <Example initial={{ type: 'model', id: MODEL_IDS.anthropic }} includeModels />
      </Cell>
      <Cell>
        <CellHeader>Preset</CellHeader>
        <Example initial={{ type: 'preset', id: 'flagship-models' }} includePresets />
      </Cell>
      <Cell>
        <CellHeader>With the type shown</CellHeader>
        <Example initial={{ type: 'model', id: MODEL_IDS.anthropic }} includeModels showType />
      </Cell>
    </Cells>
  );
}

export function Sources() {
  return (
    <Cells class="max-w-xs">
      <Cell>
        <CellHeader>Models only</CellHeader>
        <Example includeModels />
      </Cell>
      <Cell>
        <CellHeader>Assistants only</CellHeader>
        <Example includeAssistants />
      </Cell>
      <Cell>
        <CellHeader>Presets only</CellHeader>
        <Example includePresets />
      </Cell>
      <Cell>
        <CellHeader>Everything</CellHeader>
        <Example includeModels includeAssistants includePresets />
      </Cell>
    </Cells>
  );
}
