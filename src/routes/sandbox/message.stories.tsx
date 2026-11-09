import { createSignal, For } from 'solid-js';

import { MessageView } from '~/components/chat/components/message-view';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/components/ui/switch';
import { selectModelById } from '~/store/selectors';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS, sampleImageUrl } from './story-fixtures';

const exampleUser = 'How old is earth?';
const exampleAssistant =
  'Earth is approximately 4.54 billion years old. This age is based on evidence from radiometric age dating of meteorite material and is consistent with the ages of the oldest-known terrestrial and lunar samples.';
const stats = {
  promptTokens: 150,
  completionTokens: 250,
  totalTokens: 400,
  created: Date.now(),
  timeTaken: 2500,
};

export function Basic() {
  return (
    <div class="flex max-w-md flex-col gap-4">
      <MessageView id="basic-user" role="user" content={exampleUser} />
      <MessageView
        id="basic-assistant"
        role="assistant"
        content={exampleAssistant}
        usage={stats}
      />
    </div>
  );
}

export function AudioStates() {
  return (
    <Cells class="max-w-md">
      <For each={['idle', 'loading', 'playing', 'error', 'unavailable'] as const}>
        {(status) => (
          <Cell>
            <CellHeader>{status}</CellHeader>
            <MessageView
              id={`audio-${status}`}
              role="assistant"
              content={exampleUser}
              audioStatus={status}
              usage={stats}
            />
          </Cell>
        )}
      </For>
    </Cells>
  );
}

const tableContent = `### Summary and Recommendation

| Option | Implementation Effort | Downtime on Deploy | Cost Impact | Scalability | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Change ECS Deployment** | **Very Low** (Config change) | **Yes** (minutes) | None | Low (1 instance only) | **Good short-term fix** |
| **2. Migrate to RDS/Aurora** | **Medium** (Code + Infra change) | **No** | Medium | **High** | **Best long-term solution** |
| **3. Use SQLite WAL Mode** | Low (Code change) | No | None | Low (1 instance only) | **Not Recommended (Risk of data corruption)** |`;

export function WithTable() {
  return (
    <div class="grid grid-cols-2 gap-4">
      <MessageView id="with-table" role="assistant" content={tableContent} usage={stats} />
    </div>
  );
}

export function WithTableMultiple() {
  return (
    <div class="grid grid-cols-3 gap-4">
      <MessageView id="with-table-1" role="assistant" content={tableContent} usage={stats} />
      <MessageView id="with-table-2" role="assistant" content={tableContent} usage={stats} />
      <MessageView id="with-table-3" role="assistant" content={tableContent} usage={stats} />
    </div>
  );
}

export function Cancelled() {
  return (
    <div class="max-w-md">
      <MessageView
        id="cancelled"
        role="assistant"
        content="Earth is approximately"
        cancelled
        usage={stats}
      />
    </div>
  );
}

export function WithCode() {
  return (
    <div class="max-w-lg">
      <MessageView
        id="with-code"
        role="assistant"
        usage={stats}
        content={`Use \`Math.max\` to find the largest value:

\`\`\`ts
const largest = Math.max(...values);
\`\`\``}
      />
    </div>
  );
}

export function WithImages() {
  return (
    <div class="flex max-w-md flex-col gap-4">
      <MessageView
        id="with-images"
        role="user"
        content={[
          { type: 'text', text: 'What is in these images? Click one to open it.' },
          {
            type: 'image',
            image: {
              filename: 'one.svg',
              sourceType: 'path',
              storageId: sampleImageUrl('One'),
            },
          },
          {
            type: 'image',
            image: {
              filename: 'two.svg',
              sourceType: 'path',
              storageId: sampleImageUrl('Two', '#3f7d6e'),
            },
          },
        ]}
      />
    </div>
  );
}

export function DisplayOptions() {
  const model = selectModelById(MODEL_IDS.openai);
  const [showAvatars, setShowAvatars] = createSignal(false);
  const [showModelTitle, setShowModelTitle] = createSignal(true);

  return (
    <Cells class="max-w-md">
      <Cell>
        <Switch
          class="flex items-center gap-2"
          checked={showAvatars()}
          onChange={setShowAvatars}
        >
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel class="text-sm">Show avatars</SwitchLabel>
        </Switch>
        <Switch
          class="flex items-center gap-2"
          checked={showModelTitle()}
          onChange={setShowModelTitle}
        >
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel class="text-sm">Show model title (without avatars)</SwitchLabel>
        </Switch>
      </Cell>
      <div class="flex flex-col gap-4">
        <MessageView
          id="options-user"
          role="user"
          content={exampleUser}
          showAvatars={showAvatars()}
          showModelTitle={showModelTitle()}
        />
        <MessageView
          id="options-assistant"
          role="assistant"
          content={exampleAssistant}
          model={model()}
          usage={stats}
          showAvatars={showAvatars()}
          showModelTitle={showModelTitle()}
        />
      </div>
    </Cells>
  );
}
