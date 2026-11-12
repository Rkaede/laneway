import { useParams } from '@solidjs/router';
import { For, Show } from 'solid-js';

import { findStoryGroup, type StoryGroup } from './stories';

const orderedStories = (group: StoryGroup) => {
  const order = group.order ?? [];
  const rank = (name: string) => {
    const index = order.indexOf(name);
    return index === -1 ? order.length : index;
  };
  // Array.prototype.sort is stable, so unlisted stories keep their alphabetical order.
  return Object.entries(group.stories).sort(([a], [b]) => rank(a) - rank(b));
};

export default function StoryPage() {
  const params = useParams<{ story: string }>();
  const currentStory = () => findStoryGroup(params.story);

  return (
    <Show
      when={currentStory()}
      // Keyed, so each story gets a new scroll container that starts at the top.
      keyed
      fallback={
        <div class="flex h-full items-center justify-center">
          <p class="text-muted">Story not found</p>
        </div>
      }
    >
      {(story) => (
        <div class="h-full overflow-auto px-10 py-6">
          <h1 class="mb-6 text-3xl font-medium">{story.title}</h1>
          <div class="flex flex-col gap-6">
            <For each={orderedStories(story)}>
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
