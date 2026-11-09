import { IconUser } from '~/components/icons/ui';
import { Avatar, AvatarGroup } from '~/components/ui';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

export function Variants() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Primary</CellHeader>
        <Avatar variant="primary" modelId={MODEL_IDS.openai} />
      </Cell>
      <Cell>
        <CellHeader>Flat</CellHeader>
        <Avatar variant="flat" modelId={MODEL_IDS.openai} />
      </Cell>
      <Cell>
        <CellHeader>Light</CellHeader>
        <Avatar variant="light" modelId={MODEL_IDS.openai} />
      </Cell>
    </Cells>
  );
}

export function Sizes() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Small</CellHeader>
        <Avatar size="sm" modelId={MODEL_IDS.anthropic} />
      </Cell>
      <Cell>
        <CellHeader>Medium</CellHeader>
        <Avatar size="md" modelId={MODEL_IDS.anthropic} />
      </Cell>
      <Cell>
        <CellHeader>Large</CellHeader>
        <Avatar size="lg" modelId={MODEL_IDS.anthropic} />
      </Cell>
    </Cells>
  );
}

export function Content() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Children instead of a model</CellHeader>
        <Avatar>
          <IconUser class="size-5" />
        </Avatar>
      </Cell>
      <Cell>
        <CellHeader>Unknown model</CellHeader>
        <Avatar modelId="nobody/not-a-model" />
      </Cell>
    </Cells>
  );
}

export function Group() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Medium</CellHeader>
        <AvatarGroup>
          <Avatar modelId={MODEL_IDS.openai} />
          <Avatar modelId={MODEL_IDS.google} />
          <Avatar modelId={MODEL_IDS.anthropic} />
        </AvatarGroup>
      </Cell>
      <Cell>
        <CellHeader>Small</CellHeader>
        <AvatarGroup>
          <Avatar size="sm" modelId={MODEL_IDS.openai} />
          <Avatar size="sm" modelId={MODEL_IDS.google} />
          <Avatar size="sm" modelId={MODEL_IDS.anthropic} />
        </AvatarGroup>
      </Cell>
    </Cells>
  );
}
