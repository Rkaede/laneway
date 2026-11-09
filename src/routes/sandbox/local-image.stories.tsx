import { LocalImage } from '~/components/ui/local-image';

import { Cell, CellHeader, Cells } from './story-components';
import { sampleImageUrl } from './story-fixtures';

export function Sources() {
  return (
    <Cells>
      <Cell>
        <CellHeader>From a path</CellHeader>
        <LocalImage
          src={sampleImageUrl('Path')}
          sourceType="path"
          alt="A sample image"
          class="w-64 rounded-md"
        />
      </Cell>
      <Cell>
        <CellHeader>Missing from the image cache</CellHeader>
        <LocalImage src="sandbox/missing-image.png" alt="A missing image" />
      </Cell>
    </Cells>
  );
}
