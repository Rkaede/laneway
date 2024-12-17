import { JSX } from 'solid-js';

import * as AudioButtonStories from './audio-button.stories';
import * as MessageStories from './message.stories';

export function Sandbox() {
  return (
    <div class="h-full overflow-auto px-10 py-6">
      <h1 class="mb-4 border-b border-b-muted-foreground pb-0.5 text-3xl font-medium">
        UI Sandbox
      </h1>
      <div class="flex flex-col gap-16">
        <Section title="Messages">
          <Story title="Basic">
            <MessageStories.Basic />
          </Story>
          <Story title="With TTS">
            <MessageStories.WithTTS />
          </Story>
        </Section>
        <hr />
        <Section title="AudioButton">
          <Story title="States">
            <AudioButtonStories.States />
          </Story>
        </Section>
      </div>
    </div>
  );
}

function Section(props: { title: string; children?: JSX.Element }) {
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-3xl font-medium">{props.title}</h2>
      <div class="flex flex-col gap-6">{props.children}</div>
    </div>
  );
}

function Story(props: { title: string; children?: JSX.Element }) {
  return (
    <div class="flex flex-col gap-4">
      <h3 class="text-lg font-semibold">{props.title}</h3>
      <div class="flex flex-col gap-4">{props.children}</div>
    </div>
  );
}
