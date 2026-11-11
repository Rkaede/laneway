import { isMac } from '@solid-primitives/platform';
import { useNavigate, useParams } from '@solidjs/router';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  Show,
  Switch,
} from 'solid-js';
import { unwrap } from 'solid-js/store';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '~/components/ui/command';

import { commandMenuOpen, setCommandMenuOpen } from './command-menu-state';
import { shouldIgnoreShortcut } from './command-shortcuts';
import { ModelIcon } from './components/connected/model-icon';
import { IconChat, IconLayoutGrid, IconSquarePen } from './components/icons/ui';
import { store } from './store';
import { actions } from './store/actions';
import { models } from './store/models';
import {
  recentSessions,
  type SearchHit,
  type SearchSnippet,
  sessionHref,
  SessionIndex,
} from './store/search';
import { tinykeys } from './tinykeys';
import type { SessionTemplate, SessionType } from './types';

const SEARCH_RESULT_PREFIX = 'search-result:';

function formatSessionDate(created: number) {
  const date = new Date(created);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

function SessionIcon(props: { type: SessionType }) {
  return (
    <Show when={props.type === 'note'} fallback={<IconChat class="mr-2 size-4 shrink-0" />}>
      <IconSquarePen class="mr-2 size-4 shrink-0" />
    </Show>
  );
}

function Snippet(props: { snippet: SearchSnippet }) {
  return (
    <span class="truncate text-xs text-muted">
      {props.snippet.before}
      <mark class="bg-transparent font-semibold text-main">{props.snippet.match}</mark>
      {props.snippet.after}
    </span>
  );
}

function SessionResult(props: {
  value: string;
  sessionId: string;
  title: string;
  type: SessionType;
  created: number;
  hit?: SearchHit;
  onOpen: (href: string) => void;
}) {
  return (
    <CommandItem
      value={props.value}
      onSelect={() => props.onOpen(sessionHref(props.sessionId, props.hit?.messageId))}
    >
      <SessionIcon type={props.type} />
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate">{props.title}</span>
        <Show when={props.hit?.snippet}>{(snippet) => <Snippet snippet={snippet()} />}</Show>
      </span>
      <span class="ml-2 shrink-0 text-xs text-muted">{formatSessionDate(props.created)}</span>
    </CommandItem>
  );
}

export function CommandMenu() {
  const open = commandMenuOpen;
  const setOpen = setCommandMenuOpen;
  const [query, setQuery] = createSignal('');
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
  const actionArray = () =>
    Object.values(actions).filter((action) => action.available?.({ navigate, params }) ?? true);

  for (const action of Object.values(actions)) {
    if (action.shortcut) {
      keyMap[action.shortcut] = (event: KeyboardEvent) => {
        if (
          shouldIgnoreShortcut(event) ||
          action.available?.({ navigate, params, event }) === false
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
      items: models
        .filter((model) => !model.deprecated)
        .map((model) => ({
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
      items: models
        .filter((model) => !model.deprecated)
        .map((model) => ({
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

  // Sync the index when the menu opens rather than whenever the store changes, which would
  // re-index on every token while a reply streams. Only changed sessions are re-indexed.
  const sessionIndex = new SessionIndex();
  const [synced, markSynced] = createSignal(undefined, { equals: false });
  function syncIndex() {
    const { sessions, chats, assistants } = unwrap(store);
    sessionIndex.sync({ sessions, chats, assistants }, unwrap(models));
    markSynced();
  }
  createEffect(on(open, (isOpen) => isOpen && syncIndex()));

  // Building the index from scratch takes around 100ms for a full store, so do it while the app
  // is idle rather than when the menu first opens. Wait for the models, because they change what
  // every session indexes.
  createEffect(
    on(
      () => models.length > 0,
      (loaded) => {
        if (!loaded) return;
        if (typeof requestIdleCallback === 'function') {
          const id = requestIdleCallback(syncIndex, { timeout: 5000 });
          onCleanup(() => cancelIdleCallback(id));
        } else {
          const id = setTimeout(syncIndex, 2000);
          onCleanup(() => clearTimeout(id));
        }
      },
    ),
  );

  const results = createMemo(() => {
    synced();
    return sessionIndex.search(query());
  });
  const recent = () => recentSessions(store.sessions);
  const searching = () => query().trim() !== '';

  function openSession(href: string) {
    navigate(href);
    setOpen(false);
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) setQuery('');
  }

  function caseInsensitiveFilter(value: string, search: string, keywords?: string[]) {
    // Session results are already matched by the search, so cmdk must not filter them again.
    if (value.startsWith(SEARCH_RESULT_PREFIX)) return 1;
    const searchLower = search.toLowerCase();
    const valueLower = value.toLowerCase();
    return valueLower.includes(searchLower) ||
      keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
      ? 1
      : 0;
  }

  onCleanup(tinykeys(window, keyMap));

  return (
    <CommandDialog open={open()} onOpenChange={handleOpenChange} filter={caseInsensitiveFilter}>
      <CommandInput
        placeholder="Search chats, notes, commands, presets, models and assistants..."
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <Show when={searching() && results().length > 0}>
          <CommandGroup heading="Chats and notes">
            <For each={results()}>
              {(hit) => (
                <SessionResult
                  value={`${SEARCH_RESULT_PREFIX}${hit.sessionId}`}
                  sessionId={hit.sessionId}
                  title={hit.title}
                  type={hit.type}
                  created={hit.created}
                  hit={hit}
                  onOpen={openSession}
                />
              )}
            </For>
          </CommandGroup>
        </Show>
        <Show when={!searching() && recent().length > 0}>
          <CommandGroup heading="Recent chats and notes">
            <For each={recent()}>
              {(session) => (
                <SessionResult
                  value={`recent:${session.id}:${session.title}`}
                  sessionId={session.id}
                  title={session.title}
                  type={session.type}
                  created={session.created}
                  onOpen={openSession}
                />
              )}
            </For>
          </CommandGroup>
        </Show>
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
                    value={`${item.type}-${item.id}-${item.title}`}
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
                          <ModelIcon
                            modelId={
                              store.assistants.find(
                                (assistant) => assistant.id === item.referenceId,
                              )?.modelId
                            }
                            class="mr-2 size-4"
                          />
                        </Match>
                        <Match when={item.type === 'model'}>
                          <ModelIcon modelId={item.referenceId} class="mr-2 size-4" />
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
