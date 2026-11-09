import { IconCircleX, IconInfo, IconKey } from '~/components/icons/ui';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>Default</CellHeader>
        <Alert>
          <IconInfo class="size-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Your chats are stored in this browser.</AlertDescription>
        </Alert>
      </Cell>
      <Cell>
        <CellHeader>Destructive</CellHeader>
        <Alert variant="destructive">
          <IconCircleX class="size-4" />
          <AlertTitle>Request failed</AlertTitle>
          <AlertDescription>The provider returned an error.</AlertDescription>
        </Alert>
      </Cell>
      <Cell>
        <CellHeader>Warning</CellHeader>
        <Alert variant="warning">
          <IconKey class="size-4" />
          <AlertTitle>API key missing</AlertTitle>
          <AlertDescription>Add a key to start chatting.</AlertDescription>
        </Alert>
      </Cell>
    </Cells>
  );
}

export function WithoutIcon() {
  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>Title and description</CellHeader>
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Your chats are stored in this browser.</AlertDescription>
        </Alert>
      </Cell>
      <Cell>
        <CellHeader>Description only</CellHeader>
        <Alert variant="warning">
          <AlertDescription>This model is being retired soon.</AlertDescription>
        </Alert>
      </Cell>
    </Cells>
  );
}
