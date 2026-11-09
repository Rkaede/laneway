import type { ParentComponent } from 'solid-js';

import { Chatbar } from '~/components/chat/components';
import { selectModelById } from '~/store/selectors';
import type { AssistantProps, ChatProps } from '~/types';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

const chat: ChatProps = { id: 'story-chat', messages: [], status: 'idle' };

const assistant: AssistantProps = {
  id: 'story-assistant',
  title: 'Code Reviewer',
  subtitle: 'Finds bugs before they ship',
  modelId: MODEL_IDS.anthropic,
};

// The bar's side borders key off its position among its siblings, and its shadow falls below it.
const Frame: ParentComponent = (props) => (
  <div class="w-full pb-6">
    <div class="group">{props.children}</div>
  </div>
);

export function Variants() {
  const model = selectModelById(MODEL_IDS.openai);
  const assistantModel = selectModelById(MODEL_IDS.anthropic);

  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Model (hover the icon for details)</CellHeader>
        <Frame>
          <Chatbar chat={chat} model={model()} type="model" />
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Assistant with a subtitle</CellHeader>
        <Frame>
          <Chatbar
            chat={chat}
            model={assistantModel()}
            assistant={assistant}
            type="assistant"
          />
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Unknown model</CellHeader>
        <Frame>
          <Chatbar chat={chat} />
        </Frame>
      </Cell>
    </Cells>
  );
}

export function Corners() {
  const model = selectModelById(MODEL_IDS.openai);

  return (
    <div class="grid grid-cols-2 pb-6">
      <div class="group">
        <Chatbar chat={chat} model={model()} type="model" isFirst />
      </div>
      <div class="group">
        <Chatbar chat={chat} model={model()} type="model" isLast />
      </div>
    </div>
  );
}
