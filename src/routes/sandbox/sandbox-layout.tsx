import { A, useLocation } from '@solidjs/router';
import MoonIcon from 'lucide-solid/icons/moon';
import SunIcon from 'lucide-solid/icons/sun';
import { For, type ParentComponent } from 'solid-js';

import { Button } from '~/components/ui/button';
import { useApplyTheme } from '~/hooks/use-theme';
import { setStore, store } from '~/store';
import { cn } from '~/util';

import { storyMap } from './stories';

const stories = Object.entries(storyMap)
  .map(([path, { title }]) => ({ title, path }))
  .sort((a, b) => a.title.localeCompare(b.title));

const SandboxLayout: ParentComponent = (props) => {
  const location = useLocation();
  const isDark = () => store.settings.theme === 'dark';

  // The sandbox is its own route outside the app layout, so it applies the theme itself.
  useApplyTheme();

  return (
    <main class="flex size-full h-screen">
      {/* Sandbox Sidebar */}
      <div class="w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-fg">
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
                      'rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                      location.pathname === `/sandbox/${story.path}` &&
                        'bg-sidebar-accent font-medium',
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
              class="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
            >
              ← Back to App
            </A>
          </div>
        </div>
      </div>
      {/* Content Area. Each story page scrolls inside it, so the toggle stays put. */}
      <div class="relative max-w-full flex-1">
        <Button
          variant="outline"
          size="icon"
          class="absolute top-4 right-6 z-20"
          aria-label={isDark() ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setStore('settings', 'theme', isDark() ? 'light' : 'dark')}
        >
          {isDark() ? <SunIcon class="size-4" /> : <MoonIcon class="size-4" />}
        </Button>
        {props.children}
      </div>
    </main>
  );
};

export default SandboxLayout;
