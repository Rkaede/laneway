import { ModelCard, ModelIcon } from '~/components/connected';
import { selectModelById } from '~/store/selectors';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

export function Variants() {
  const model = selectModelById(MODEL_IDS.anthropic);

  return (
    <Cells>
      <Cell>
        <CellHeader>Default (hover for details)</CellHeader>
        <ModelCard model={model()}>
          <ModelIcon modelId={model()?.id} class="size-6" />
        </ModelCard>
      </Cell>
      <Cell>
        <CellHeader>Light</CellHeader>
        <ModelCard model={model()} variant="light">
          <ModelIcon modelId={model()?.id} class="size-6" />
        </ModelCard>
      </Cell>
    </Cells>
  );
}

export function Models() {
  const vision = selectModelById(MODEL_IDS.openai);
  const free = selectModelById(MODEL_IDS.free);
  const reasoning = selectModelById(MODEL_IDS.reasoning);

  return (
    <Cells>
      <Cell>
        <CellHeader>Vision tag</CellHeader>
        <ModelCard model={vision()}>
          <ModelIcon modelId={vision()?.id} class="size-6" />
        </ModelCard>
      </Cell>
      <Cell>
        <CellHeader>Free tag</CellHeader>
        <ModelCard model={free()}>
          <ModelIcon modelId={free()?.id} class="size-6" />
        </ModelCard>
      </Cell>
      <Cell>
        <CellHeader>Reasoning tag</CellHeader>
        <ModelCard model={reasoning()}>
          <ModelIcon modelId={reasoning()?.id} class="size-6" />
        </ModelCard>
      </Cell>
      <Cell>
        <CellHeader>Unknown model, with an empty card</CellHeader>
        <ModelCard>
          <ModelIcon class="size-6" />
        </ModelCard>
      </Cell>
    </Cells>
  );
}
