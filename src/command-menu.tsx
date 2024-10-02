import { isMac } from '@solid-primitives/platform';
import { useNavigate, useParams } from '@solidjs/router';
import { createEffect, createSignal, For, Match, onCleanup, Show, Switch } from 'solid-js';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '~/components/ui/command';

import { ModelIcon } from './components/connected/model-icon';
import { IconLayoutGrid } from './components/icons/ui';
import { store } from './store';
import { actions } from './store/actions';
import { models } from './store/models';
import { tinykeys } from './tinykeys';
import type { SessionTemplate } from './types';

export function CommandMenu() {
  const [open, setOpen] = createSignal(false);
  const navigate = useNavigate();
  const params = useParams();

  createEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    onCleanup(() => document.removeEventListener('keydown', down));
  });

  const keyMap: Record<string, (e: KeyboardEvent) => void> = {};
  const actionArray = () => Object.values(actions);

  for (const action of actionArray()) {
    if (action.shortcut) {
      keyMap[action.shortcut] = (event: KeyboardEvent) => {
        // if we're using an input, don't trigger the action
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement ||
          (event.target instanceof HTMLElement && event.target.closest('.cm-editor'))
        ) {
          return;
        }
        event.preventDefault();
        action.fn({ navigate, params, event });
      };
    }
  }

  const newSessionItems = (): {
    heading: string;
    items: SessionTemplate[];
  }[] => [
    {
      heading: 'New chat with model...',
      items: models.map((model) => ({
        type: 'model',
        id: `c-${model.id}`,
        title: model.title,
        sessionType: 'chat',
        referenceId: model.id,
      })),
    },
    {
      heading: 'New chat with assistant...',
      items: store.assistants.map((assistant) => ({
        id: `c-${assistant.id}`,
        type: 'assistant',
        title: assistant.title,
        sessionType: 'chat',
        referenceId: assistant.id,
      })),
    },
    {
      heading: 'New chat with preset...',
      items: store.presets.map((preset) => ({
        id: `c-${preset.id}`,
        type: 'preset',
        title: preset.presetTitle,
        sessionType: 'chat',
        referenceId: preset.id,
      })),
    },
    {
      heading: 'New note with model...',
      items: models.map((model) => ({
        id: `n-${model.id}`,
        type: 'model',
        title: model.title,
        sessionType: 'note',
        referenceId: model.id,
      })),
    },
    {
      heading: 'New note with assistant...',
      items: store.assistants.map((assistant) => ({
        id: `n-${assistant.id}`,
        type: 'assistant',
        title: assistant.title,
        sessionType: 'note',
        referenceId: assistant.id,
      })),
    },
  ];

  function caseInsensitiveFilter(value: string, search: string, keywords?: string[]) {
    const searchLower = search.toLowerCase();
    const valueLower = value.toLowerCase();
    return valueLower.includes(searchLower) ||
      keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
      ? 1
      : 0;
  }

  tinykeys(window, keyMap);

  return (
    <CommandDialog open={open()} onOpenChange={setOpen} filter={caseInsensitiveFilter}>
      <CommandInput placeholder="Search commands, presets, models and assistants..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <For each={actionArray()}>
            {(item) => (
              <CommandItem
                class="flex items-center gap-2"
                keywords={item.keywords}
                onSelect={() => {
                  item.fn({ navigate, params });
                  setOpen(false);
                }}
              >
                <span>{item.icon({})}</span>
                <span>{item.name}</span>
                <Show when={item.shortcut}>
                  <CommandShortcut>
                    {item.shortcut?.replace(/\$mod/g, isMac ? '⌘' : 'Ctrl')}
                  </CommandShortcut>
                </Show>
              </CommandItem>
            )}
          </For>
        </CommandGroup>
        <For each={newSessionItems()}>
          {(group) => (
            <CommandGroup heading={group.heading}>
              <For each={group.items}>
                {(item) => (
                  <CommandItem
                    value={`${item.type}-${item.id}`}
                    onSelect={() => {
                      if (item.sessionType === 'note') {
                        actions.newNote.fn(
                          { navigate, params },
                          { referenceId: item.referenceId, type: item.type },
                        );
                      } else {
                        actions.newSession.fn(
                          { navigate, params },
                          { referenceId: item.referenceId, type: item.type },
                        );
                      }
                      setOpen(false);
                    }}
                  >
                    <span>
                      <Switch>
                        <Match when={item.type === 'preset'}>
                          <IconLayoutGrid class="mr-2 size-4" />
                        </Match>
                        <Match when={item.type === 'assistant'}>
                          <Show when={item.referenceId}>
                            {(modelId) => <ModelIcon modelId={modelId()} class="mr-2 size-4" />}
                          </Show>
                        </Match>
                        <Match when={item.type === 'model'}>
                          <ModelIcon modelId={item.id} class="mr-2 size-4" />
                        </Match>
                      </Switch>
                    </span>
                    <span>{item.title}</span>
                  </CommandItem>
                )}
              </For>
            </CommandGroup>
          )}
        </For>
      </CommandList>
    </CommandDialog>
  );
}
