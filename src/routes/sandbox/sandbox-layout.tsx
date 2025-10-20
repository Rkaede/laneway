import { A, useLocation } from '@solidjs/router';
import { For, type ParentComponent } from 'solid-js';

import { cn } from '~/util';

const stories = [
  { title: 'AudioButton', path: 'audio-button' },
  { title: 'Avatar', path: 'avatar' },
  { title: 'Badge', path: 'badge' },
  { title: 'Button', path: 'button' },
  { title: 'ChatCard', path: 'chatcard' },
  { title: 'ChatInput', path: 'chat-input' },
  { title: 'CodeBlock', path: 'codeblock' },
  { title: 'Icons', path: 'icons' },
  { title: 'IconBadge', path: 'icon-badge' },
  { title: 'Lightbox', path: 'lightbox' },
  { title: 'Message', path: 'message' },
  { title: 'MultiCombobox', path: 'multi-combobox' },
  { title: 'StatsPopover', path: 'stats-popover' },
  { title: 'Switch', path: 'switch' },
  { title: 'useAnimatedText', path: 'use-animated-text' },
].sort((a, b) => a.title.localeCompare(b.title));

const SandboxLayout: ParentComponent = (props) => {
  const location = useLocation();

  return (
    <main class="flex size-full h-screen">
      {/* Sandbox Sidebar */}
      <div class="border-border-200 w-[240px] flex-shrink-0 border-r bg-background">
        <div class="flex h-full flex-col overflow-hidden">
          <div class="border-b px-4 py-3">
            <h2 class="text-lg font-semibold">UI Sandbox</h2>
          </div>
          <div class="flex-1 overflow-auto">
            <nav class="flex flex-col gap-1 p-2">
              <For each={stories}>
                {(story) => (
                  <A
                    href={`/sandbox/${story.path}`}
                    class={cn(
                      'rounded-md px-3 py-2 text-sm transition-colors hover:bg-background-2',
                      location.pathname === `/sandbox/${story.path}` &&
                        'bg-background-2 font-medium',
                    )}
                  >
                    {story.title}
                  </A>
                )}
              </For>
            </nav>
          </div>
          <div class="border-t p-2">
            <A
              href="/"
              class="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-background-2"
            >
              ← Back to App
            </A>
          </div>
        </div>
      </div>
      {/* Content Area */}
      <div class="max-w-full flex-1">{props.children}</div>
    </main>
  );
};

export default SandboxLayout;
