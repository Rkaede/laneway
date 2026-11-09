import { createSignal } from 'solid-js';

import { ChatSettings } from '~/components/connected/chat-settings';

import { MODEL_IDS } from './story-fixtures';

function Example(props: {
  name?: string;
  subtitle?: string;
  modelId?: string;
  systemPrompt?: string;
}) {
  // oxlint-disable-next-line solid/reactivity -- Only the first value of each prop is used.
  const [name, setName] = createSignal(props.name ?? '');
  // oxlint-disable-next-line solid/reactivity -- Only the first value of each prop is used.
  const [subtitle, setSubtitle] = createSignal(props.subtitle ?? '');
  // oxlint-disable-next-line solid/reactivity -- Only the first value of each prop is used.
  const [modelId, setModelId] = createSignal(props.modelId);
  // oxlint-disable-next-line solid/reactivity -- Only the first value of each prop is used.
  const [systemPrompt, setSystemPrompt] = createSignal(props.systemPrompt ?? '');

  return (
    <div class="max-w-2xl">
      <ChatSettings
        name={name()}
        subtitle={subtitle()}
        modelId={modelId()}
        systemPrompt={systemPrompt()}
        onNameChange={setName}
        onSubtitleChange={setSubtitle}
        onModelChange={setModelId}
        onSystemPromptChange={setSystemPrompt}
      />
    </div>
  );
}

export function Empty() {
  return <Example />;
}

export function Filled() {
  return (
    <Example
      name="Code Reviewer"
      subtitle="Finds bugs before they ship"
      modelId={MODEL_IDS.anthropic}
      systemPrompt="You review code and point out bugs."
    />
  );
}
