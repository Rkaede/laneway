import { createEffect, type ParentComponent } from 'solid-js';

import { AppSidebar } from '~/app-sidebar';
import { store } from '~/store';

import { CommandMenu } from './command-menu';
import About from './components/connected/about';

export const AppLayout: ParentComponent = (props) => {
  createEffect(() => {
    document.body.classList.toggle('dark', store.settings.theme === 'dark');
  });
  return (
    <main class="flex size-full h-screen">
      <div
        class="border-border-200 w-[240px] flex-shrink-0 border-r bg-background"
        style={{
          'margin-left': store.settings.sidebarOpen ? 0 : '-240px',
        }}
      >
        <AppSidebar open={store.settings.sidebarOpen} />
      </div>
      <div class="max-w-full flex-1">{props.children}</div>
      <CommandMenu />
      <About />
    </main>
  );
};
