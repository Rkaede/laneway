import { createSignal } from 'solid-js';

import { FollowToggle, JumpToLatest } from '~/components/chat/components';

import { Cell, CellHeader, Cells } from './story-components';

export function FollowToggleStates() {
  const [following, setFollowing] = createSignal(true);

  return (
    <Cells>
      <Cell>
        <CellHeader>Interactive</CellHeader>
        <FollowToggle following={following()} onToggle={() => setFollowing(!following())} />
      </Cell>
      <Cell>
        <CellHeader>Following</CellHeader>
        <FollowToggle following onToggle={() => {}} />
      </Cell>
      <Cell>
        <CellHeader>Not following</CellHeader>
        <FollowToggle following={false} onToggle={() => {}} />
      </Cell>
    </Cells>
  );
}

export function JumpToLatestButton() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <JumpToLatest onClick={() => {}} />
      </Cell>
    </Cells>
  );
}
