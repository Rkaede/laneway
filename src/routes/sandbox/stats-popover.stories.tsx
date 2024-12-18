import { StatsPopoverContent } from '~/components/ui/stats-popover';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Empty</CellHeader>
        <StatsPopoverContent stats={{}} />
      </Cell>
      <Cell>
        <CellHeader>With Tokens</CellHeader>
        <StatsPopoverContent
          stats={{
            promptTokens: 150,
            completionTokens: 250,
            totalTokens: 400,
          }}
        />
      </Cell>
      <Cell>
        <CellHeader>With Timing</CellHeader>
        <StatsPopoverContent
          stats={{
            promptTokens: 150,
            completionTokens: 250,
            totalTokens: 400,
            created: Date.now(),
            timeTaken: 2500,
          }}
        />
      </Cell>
    </Cells>
  );
}
