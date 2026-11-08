import { useLocation, useNavigate, useParams } from '@solidjs/router';
import { type Component, createEffect, createSignal, For, on, Show } from 'solid-js';

import { requestApiKey } from '~/components/connected/api-key-request';
import {
  IconBox,
  IconKey,
  IconLayoutGrid,
  IconNewSession,
  IconScanFace,
  IconSettings,
  IconSquarePen,
  MoreHorizontalIcon,
} from '~/components/icons/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  SidebarGroup,
  SidebarIcon,
  SidebarItem,
  SidebarItems,
  SidebarLinkItem,
} from '~/components/ui';
import { Button } from '~/components/ui/button';
import { setStore, store } from '~/store';
import { actions, renameSession, toggleSidebar } from '~/store/actions';
import { anyKeysSet, selectSessionById } from '~/store/selectors';
import type { SessionProps } from '~/types';
import { groupByDate } from '~/util';

const groupTitles = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 Days',
  older: 'Older',
  examples: 'Examples',
};

type GroupTitle = keyof typeof groupTitles;

function SessionGroup(props: {
  sessions: SessionProps[];
  title: GroupTitle;
  activeSession?: string;
}) {
  const location = useLocation();
  const loadingSessions = () =>
    store.chats.filter((c) => c.controller instanceof AbortController).map((c) => c.sessionId);

  return (
    <Show when={!(props.sessions.length === 0)}>
      <SidebarGroup title={groupTitles[props.title]}>
        <SidebarItems>
          <For each={props.sessions}>
            {(session) => {
              const active = () => location.pathname.endsWith(`/${session.id}`);
              return (
                <SidebarLinkItem
                  isLoading={loadingSessions().includes(session.id)}
                  href={`/session/${session.id}`}
                  active={active()}
                  sessionId={session.id}
                  dropdown={<SidebarItemDropdown sessionId={session.id} />}
                >
                  {session.title}
                </SidebarLinkItem>
              );
            }}
          </For>
        </SidebarItems>
      </SidebarGroup>
    </Show>
  );
}

export const AppSidebar: Component<{ open?: boolean }> = (props) => {
  const navigate = useNavigate();
  const params = useParams();

  function handleNewChat() {
    actions.newSession.fn({ navigate, params });
  }

  function handleNewNote() {
    actions.newNote.fn({ navigate, params });
  }

  const groups = () => groupByDate(store.sessions);

  return (
    <div data-component="Sidebar" class="relative flex h-full">
      <div class="flex h-full w-full flex-col overflow-hidden">
        <div class="px-2 pt-2 pb-4" inert={!props.open}>
          <SidebarItems>
            <SidebarItem onClick={handleNewChat} icon={<IconNewSession class="mr-2 size-4" />}>
              New Chat
            </SidebarItem>
            <SidebarItem onClick={handleNewNote} icon={<IconSquarePen class="mr-2 size-4" />}>
              New Note
            </SidebarItem>
            <Show when={!anyKeysSet()}>
              <SidebarItem
                onClick={() => requestApiKey()}
                icon={<IconKey class="mr-2 size-4" />}
                class="text-brand-subtle-fg"
              >
                Add API key
              </SidebarItem>
            </Show>
          </SidebarItems>
        </div>
        <div class="flex-1 overflow-auto" inert={!props.open}>
          <Show when={store.sessions.length === 0}>
            <div role="status" class="px-4 py-6 text-sm text-muted">
              <p>No chats or notes yet.</p>
              <p class="mt-1">Start one from the menu above.</p>
            </div>
          </Show>
          <For each={Object.entries(groups())}>
            {([title, sessions]) => {
              return <SessionGroup sessions={sessions} title={title as GroupTitle} />;
            }}
          </For>
        </div>
        <div class="px-2 py-2" inert={!props.open}>
          <PagesMenu />
        </div>
      </div>
      <div class="absolute top-0 right-0 bottom-0 z-10 flex translate-x-full items-center">
        <button
          type="button"
          aria-label="Toggle sidebar"
          class="flex items-center justify-center bg-transparent p-0 hover:outline-hidden"
          onClick={toggleSidebar}
        >
          <SidebarIcon open={props.open} />
        </button>
      </div>
      <Show when={store.dialogs.renameSession.sessionId}>
        {(sessionId) => <RenameDialog sessionId={sessionId()} />}
      </Show>
    </div>
  );
};

const pages = [
  { href: '/settings', label: 'Settings', icon: IconSettings },
  { href: '/presets', label: 'Presets', icon: IconLayoutGrid },
  { href: '/assistants', label: 'Assistants', icon: IconScanFace },
  { href: '/models', label: 'Models', icon: IconBox },
];

function PagesMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <DropdownMenu placement="top-start">
      <DropdownMenuTrigger
        as={Button}
        aria-label="Open menu"
        variant="ghost"
        size="icon"
        class="text-muted hover:text-main data-[expanded]:bg-surface-hover data-[expanded]:text-main"
      >
        <IconSettings class="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48">
        <DropdownMenuGroup>
          <For each={pages}>
            {(page) => (
              <DropdownMenuItem
                class="gap-2"
                aria-current={location.pathname === page.href ? 'page' : undefined}
                onSelect={() => navigate(page.href)}
              >
                <page.icon class="size-4 text-muted" />
                {page.label}
              </DropdownMenuItem>
            )}
          </For>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarItemDropdown(props: { sessionId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const [open, setOpen] = createSignal(false);
  return (
    <DropdownMenu open={open()} onOpenChange={(o) => setOpen(o)}>
      <DropdownMenuTrigger
        as={Button}
        aria-label="Chat or note actions"
        class="flex size-6 items-center justify-center rounded-md p-0 text-muted opacity-0 transition-none group-hover:opacity-100 hover:text-main data-[open='true']:opacity-100"
        data-open={open()}
        variant="ghost"
        size="icon"
        onClick={(e: MouseEvent) => e.stopPropagation()}
        // we need this to prevent this event from bubbling up to the parent
        // which would cause navigation to the session
        onMouseDown={(e: MouseEvent) => e.stopPropagation()}
      >
        <MoreHorizontalIcon class="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-24">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onMouseDown={(e) => e.stopPropagation()}
            onSelect={() => {
              if (!props.sessionId) return;
              actions.deleteSession.fn({ navigate, params }, { sessionId: props.sessionId });
            }}
          >
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              if (!props.sessionId) return;
              setStore('dialogs', 'renameSession', 'sessionId', props.sessionId);
            }}
          >
            Rename
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const RenameDialog: Component<{ sessionId: string }> = (props) => {
  const [title, setTitle] = createSignal('');
  const session = selectSessionById(() => props.sessionId);

  createEffect(
    on(
      () => props.sessionId,
      () => setTitle(session()?.title ?? ''),
    ),
  );

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (renameSession(props.sessionId, title())) closeDialog();
  }

  function closeDialog() {
    setStore('dialogs', 'renameSession', 'sessionId', undefined);
  }

  function handleOnOpenChange(open: boolean) {
    if (!open) {
      closeDialog();
    }
  }

  return (
    <Dialog open={props.sessionId !== undefined} onOpenChange={handleOnOpenChange}>
      <DialogContent as="form" onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {session()?.type === 'note' ? 'Rename Note' : 'Rename Chat'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <Input
                value={title()}
                onInput={(e) => {
                  setTitle(e.target.value);
                }}
              />
            </div>
          </div>
        </DialogDescription>
        <DialogFooter>
          <Button type="submit" disabled={!title().trim() || !session()}>
            Rename
          </Button>
          <Button type="button" onClick={closeDialog}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
