import { AudioButton } from '~/components/ui/message/audio-button';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Idle</CellHeader>
        <AudioButton status="idle" />
      </Cell>
      <Cell>
        <CellHeader>Loading</CellHeader>
        <AudioButton status="loading" />
      </Cell>
      <Cell>
        <CellHeader>Playing</CellHeader>
        <AudioButton status="playing" />
      </Cell>
      <Cell>
        <CellHeader>Error</CellHeader>
        <AudioButton status="error" />
      </Cell>
      <Cell>
        <CellHeader>Unavailable</CellHeader>
        <AudioButton status="unavailable" />
      </Cell>
    </Cells>
  );
}
