import { useLocation, useNavigate } from '@solidjs/router';
import { type Component, createEffect, createSignal, For, Show } from 'solid-js';

import {
  IconBox,
  IconLayoutGrid,
  IconPlus,
  IconScanFace,
  IconSettings,
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
  SidebarItems,
  SidebarLinkItem,
} from '~/components/ui';
import { Button } from '~/components/ui/button';
import { setStore, store } from '~/store';
import { deleteSession, renameSession, resetDraft, toggleSidebar } from '~/store/actions';
import type { SessionProps } from '~/types';
import { groupByDate } from '~/util';

const groupTitles = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 Days',
  older: 'Older',
};

type GroupTitle = keyof typeof groupTitles;

function SessionGroup(props: {
  sessions: SessionProps[];
  title: GroupTitle;
  activeSession?: string;
}) {
  const location = useLocation();

  return (
    <Show when={!(props.sessions.length === 0)}>
      <SidebarGroup title={groupTitles[props.title]}>
        <SidebarItems>
          <For each={props.sessions}>
            {(session) => (
              <SidebarLinkItem
                href={`/session/${session.id}`}
                active={location.pathname === `/session/${session.id}`}
                sessionId={session.id}
                dropdown={<SidbarItemDropdown sessionId={session.id} />}
              >
                {session.title}
              </SidebarLinkItem>
            )}
          </For>
        </SidebarItems>
      </SidebarGroup>
    </Show>
  );
}

export const AppSidebar: Component<{ open?: boolean }> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  function handleNew() {
    resetDraft();
    navigate('/');
  }

  const groups = () => groupByDate(store.sessions);

  return (
    <div data-component="Sidebar" class="relative flex h-full">
      <div class="flex h-full w-full flex-col overflow-hidden">
        <div
          class="flex w-full items-center justify-center border-b px-4 py-2"
          inert={!props.open}
        >
          <Button onClick={handleNew} variant="outline">
            <IconPlus class="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div class="flex-1 overflow-auto border-b" inert={!props.open}>
          <For each={Object.entries(groups())}>
            {([title, sessions]) => {
              return <SessionGroup sessions={sessions} title={title as GroupTitle} />;
            }}
          </For>
        </div>
        <SidebarItems class="px-2 py-2">
          <SidebarLinkItem
            href="/models"
            active={location.pathname === '/models'}
            class="w-full"
            icon={<IconBox class="mr-2 size-4" />}
          >
            Models
          </SidebarLinkItem>
          <SidebarLinkItem
            href="/assistants"
            active={location.pathname === '/assistants'}
            class="w-full"
            icon={<IconScanFace class="mr-2 size-4" />}
          >
            Assistants
          </SidebarLinkItem>
          <SidebarLinkItem
            href="/presets"
            active={location.pathname === '/presets'}
            class="w-full"
            icon={<IconLayoutGrid class="mr-2 size-4" />}
          >
            Presets
          </SidebarLinkItem>
          <SidebarLinkItem
            href="/settings"
            active={location.pathname === '/settings'}
            class="w-full"
            icon={<IconSettings class="mr-2 size-4" />}
          >
            Settings
          </SidebarLinkItem>
        </SidebarItems>
      </div>
      <div class="absolute bottom-0 right-0 top-0 z-10 flex translate-x-full items-center">
        <button
          type="button"
          class="flex items-center justify-center bg-transparent p-0 text-white hover:outline-none"
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

function SidbarItemDropdown(props: { sessionId?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  return (
    <DropdownMenu open={open()} onOpenChange={(o) => setOpen(o)}>
      <DropdownMenuTrigger
        as={Button}
        class="flex size-6 items-center justify-center rounded-md p-0 text-white opacity-0 transition-none hover:bg-background-4 group-hover:opacity-100 data-[open='true']:opacity-100"
        data-open={open()}
        variant="ghost"
        size="icon"
      >
        <MoreHorizontalIcon class="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-24">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              if (!props.sessionId) return;
              deleteSession(props.sessionId);
              navigate('/');
            }}
          >
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
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
  const session = () => store.sessions.find((s) => s.id === props.sessionId);

  createEffect(() => {
    if (session()) {
      setTitle(session()?.title ?? '');
    }
  });

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Chat Session</DialogTitle>
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
          <Button
            onClick={() => {
              const _session = session();
              if (title() === '' || !_session) return;
              renameSession(_session.id, title());
              closeDialog();
            }}
          >
            Rename
          </Button>
          <Button onClick={closeDialog}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
