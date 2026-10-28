import { useParams } from '@solidjs/router';
import { For, Show } from 'solid-js';

import { storyMap } from './stories';

export default function StoryPage() {
  const params = useParams<{ story: string }>();

  return (
    <Show
      when={storyMap[params.story]}
      fallback={
        <div class="flex h-full items-center justify-center">
          <p class="text-muted">Story not found</p>
        </div>
      }
    >
      {(story) => (
        <div class="h-full overflow-auto px-10 py-6">
          <h1 class="mb-6 text-3xl font-medium">{story().title}</h1>
          <div class="flex flex-col gap-6">
            <For each={Object.entries(story().stories)}>
              {([name, Component]) => (
                <div>
                  <h3 class="mb-4 text-lg font-semibold">{name}</h3>
                  <div class="rounded-card border bg-surface-raised px-12 py-6">
                    <div class="flex flex-col gap-4">
                      <Component />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  );
}
