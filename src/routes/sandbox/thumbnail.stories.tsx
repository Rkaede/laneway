import { createSignal, Show } from 'solid-js';

import { Thumbnail } from '~/components/ui/thumbnail';

import { Cell, CellHeader, Cells } from './story-components';
import { sampleImageUrl } from './story-fixtures';

export function Default() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Click to open the full image</CellHeader>
        <Thumbnail file={sampleImageUrl('Photo')} alt="A sample photo" />
      </Cell>
    </Cells>
  );
}

export function Removable() {
  const [removed, setRemoved] = createSignal(false);

  return (
    <Cells>
      <Cell>
        <CellHeader>Hover for the remove button</CellHeader>
        <Show when={!removed()} fallback={<p class="text-sm text-muted">Removed</p>}>
          <Thumbnail
            file={sampleImageUrl('Photo')}
            alt="A sample photo"
            onRemove={() => setRemoved(true)}
          />
        </Show>
      </Cell>
    </Cells>
  );
}
