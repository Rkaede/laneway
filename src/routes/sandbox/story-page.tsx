import { useParams } from '@solidjs/router';
import { For, JSX, Match, Switch } from 'solid-js';

import { cn } from '~/util';

import * as AudioButtonStories from './audio-button.stories';
import * as AvatarStories from './avatar.stories';
import * as BadgeStories from './badge.stories';
import * as ButtonStories from './button.stories';
import * as ChatInputStories from './chat-input.stories';
import * as ChatCardStories from './chatcard.stories';
import * as CodeblockStories from './codeblock.stories';
import * as IconBadgeStories from './icon-badge.stories';
import * as IconStories from './icons.stories';
import * as LightboxStories from './lightbox.stories';
import * as MessageStories from './message.stories';
import * as MultiComboboxStories from './multi-combobox.stories';
import * as StatsPopoverStories from './stats-popover.stories';
import * as SwitchStories from './switch-stories';
import * as UseAnimatedText from './use-animated-text.stories';

const storyMap: Record<
  string,
  { title: string; stories: Record<string, () => JSX.Element>; noTheme?: boolean }
> = {
  'audio-button': { title: 'AudioButton', stories: AudioButtonStories },
  avatar: { title: 'Avatar', stories: AvatarStories },
  badge: { title: 'Badge', stories: BadgeStories },
  button: { title: 'Button', stories: ButtonStories },
  chatcard: { title: 'ChatCard', stories: ChatCardStories },
  'chat-input': { title: 'ChatInput', stories: ChatInputStories },
  codeblock: { title: 'CodeBlock', stories: CodeblockStories },
  icons: { title: 'Icons', stories: IconStories },
  'icon-badge': { title: 'IconBadge', stories: IconBadgeStories },
  lightbox: { title: 'Lightbox', stories: LightboxStories },
  message: { title: 'Message', stories: MessageStories },
  'multi-combobox': { title: 'MultiCombobox', stories: MultiComboboxStories },
  'stats-popover': { title: 'StatsPopover', stories: StatsPopoverStories },
  switch: { title: 'Switch', stories: SwitchStories },
  'use-animated-text': { title: 'useAnimatedText', stories: UseAnimatedText, noTheme: true },
};

export default function StoryPage() {
  const params = useParams<{ story: string }>();
  const story = () => storyMap[params.story];

  return (
    <Switch>
      <Match when={!story()}>
        <div class="flex h-full items-center justify-center">
          <p class="text-muted-foreground">Story not found</p>
        </div>
      </Match>
      <Match when={story()}>
        <div class="h-full overflow-auto px-10 py-6">
          <h1 class="mb-6 text-3xl font-medium">{story().title}</h1>
          <div class="flex flex-col gap-6">
            <For each={Object.entries(story().stories)}>
              {([name, Component]) => {
                return (
                  <div>
                    <h3 class="mb-4 text-lg font-semibold">{name}</h3>
                    <div class="flex flex-col gap-4">
                      {story().noTheme ? (
                        <StoryContainer>
                          <Component />
                        </StoryContainer>
                      ) : (
                        <>
                          <ThemeProvider theme="light">
                            <StoryContainer>
                              <Component />
                            </StoryContainer>
                          </ThemeProvider>
                          <ThemeProvider theme="dark">
                            <StoryContainer>
                              <Component />
                            </StoryContainer>
                          </ThemeProvider>
                        </>
                      )}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Match>
    </Switch>
  );
}

function ThemeProvider(props: { children: JSX.Element; theme?: 'light' | 'dark' }) {
  return (
    <div
      class={cn(props.theme, 'rounded bg-background-main px-12 py-6 text-foreground', {
        border: props.theme !== 'dark',
      })}
    >
      {props.children}
    </div>
  );
}

function StoryContainer(props: { children?: JSX.Element }) {
  return <div class="flex flex-col gap-4">{props.children}</div>;
}
