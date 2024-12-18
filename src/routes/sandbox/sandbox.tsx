import { For, JSX } from 'solid-js';

import { cn } from '~/util';

import * as AudioButtonStories from './audio-button.stories';
import * as MessageStories from './message.stories';
import * as StatsPopoverStories from './stats-popover.stories';
import * as SwitchStories from './switch-stories';

const stories = [
  { title: 'StatsPopover', stories: StatsPopoverStories },
  { title: 'AudioButton', stories: AudioButtonStories },
  { title: 'Message', stories: MessageStories },
  { title: 'Switch', stories: SwitchStories },
];

export default function Sandbox() {
  return (
    <div class="h-full overflow-auto px-10 py-6">
      <h1 class="mb-4 border-b border-b-background-2 pb-0.5 text-4xl font-medium">
        UI Sandbox
      </h1>
      <div class="flex flex-col">
        <For each={stories}>
          {(story) => (
            <div>
              <Section title={story.title}>
                <For each={Object.entries(story.stories)}>
                  {([name, Component]) => (
                    <div>
                      <div>
                        <h3 class="text-lg font-semibold">{name}</h3>
                        <div class="flex flex-wrap gap-4">
                          <div>
                            <ThemeProvider theme="light">
                              <Story>
                                <Component />
                              </Story>
                            </ThemeProvider>
                          </div>
                          <div>
                            <ThemeProvider theme="dark">
                              <Story>
                                <Component />
                              </Story>
                            </ThemeProvider>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </Section>
              <hr class="mb-8 mt-16" />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function ThemeProvider(props: { children: JSX.Element; theme?: 'light' | 'dark' }) {
  return (
    <div
      class={cn(props.theme, 'rounded bg-background-main px-12 py-6 text-foreground', {
        border: props.theme !== 'dark',
      })}
    >
      <div class="flex flex-col gap-16">{props.children}</div>
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

function Story(props: { children?: JSX.Element }) {
  return <div class="flex flex-col gap-4">{props.children}</div>;
}
