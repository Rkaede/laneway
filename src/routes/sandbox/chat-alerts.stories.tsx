import { AlertApiKey, AlertError, AlertNoVision } from '~/components/chat/components';
import { noop } from '~/util';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>AlertError</CellHeader>
        <AlertError error={{ message: 'The provider returned a 500 error.' }} onRetry={noop} />
      </Cell>
      <Cell>
        <CellHeader>AlertError with a long, unbroken message</CellHeader>
        <AlertError error={{ message: `Failed: ${'x'.repeat(200)}` }} onRetry={noop} />
      </Cell>
      <Cell>
        <CellHeader>AlertNoVision</CellHeader>
        <AlertNoVision />
      </Cell>
      <Cell>
        <CellHeader>AlertApiKey</CellHeader>
        <AlertApiKey onAddKey={noop} />
      </Cell>
    </Cells>
  );
}
