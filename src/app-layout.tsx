import type { ParentComponent } from 'solid-js';

import { AppSidebar } from '~/app-sidebar';
import { Notifications } from '~/components/ui/notifications';
import { useApplyTheme } from '~/hooks/use-theme';
import { store } from '~/store';

import { CommandMenu } from './command-menu';
import About from './components/connected/about';

export const AppLayout: ParentComponent = (props) => {
  useApplyTheme();
  return (
    <main class="flex size-full h-dvh">
      <div
        class="w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-fg"
        style={{
          'margin-left': store.settings.sidebarOpen ? 0 : '-240px',
        }}
      >
        <AppSidebar open={store.settings.sidebarOpen} />
      </div>
      <div class="max-w-full flex-1">{props.children}</div>
      <CommandMenu />
      <About />
      <Notifications />
    </main>
  );
};
