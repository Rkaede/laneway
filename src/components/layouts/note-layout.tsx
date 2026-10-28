import { isMac } from '@solid-primitives/platform';
import { Component, For, lazy, Show } from 'solid-js';

import { ChatPanel } from '~/components/chat/chat-panel';
import { useSession } from '~/components/connected/session-provider';
import { SpeedDial } from '~/components/connected/speed-dial';
import { IconSendHorizontal, IconSquare } from '~/components/icons/ui';
import { Button, ScrollPanel } from '~/components/ui';
import { createSession } from '~/hooks/use-session';
import { store } from '~/store';
import { setSessionInput } from '~/store/actions';
import { selectChatById } from '~/store/selectors';
const TextEditor = lazy(() => import('../ui/text-editor/text-editor'));

export function NoteLayout(props: { sessionId?: string }) {
  const session = createSession(() => props.sessionId);
  const sessionContext = useSession();

  return (
    <div class="grid size-full min-h-0 grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
      <div class="min-h-0 min-w-0">
        <div class="grid h-full bg-surface-sunken p-3">
          <TextEditor
            onInput={(value) => setSessionInput(value, props.sessionId)}
            initialValue={session.input}
            onSubmit={() => session.handleSubmit()}
            class="col-start-1 row-start-1 min-h-0 min-w-0"
            placeholder="Write and refine a single prompt"
            mode="note"
          />
          <div class="z-10 col-start-1 row-start-1 mt-1 mr-0.5 mb-0 gap-0.5 place-self-end">
            <Show
              when={sessionContext.isLoading()}
              fallback={
                <Button
                  variant="ghost"
                  aria-label="Send note"
                  aria-keyshortcuts={`${isMac ? 'Meta' : 'Control'}+Enter Shift+Enter`}
                  title={`Send note (${isMac ? '⌘' : 'Ctrl'} + Enter or Shift + Enter)`}
                  size="default"
                  onClick={() => session.handleSubmit()}
                >
                  <IconSendHorizontal class="h-4 w-4" />
                </Button>
              }
            >
              <Button
                variant="ghost"
                aria-label="Stop"
                size="default"
                onClick={sessionContext.cancelChats}
              >
                <IconSquare class="h-4 w-4" fill="currentColor" />
              </Button>
            </Show>
          </div>
          <div class="z-10 col-start-1 row-start-1 mt-1 mr-0.5 mb-0 flex flex-col items-end gap-0.5 place-self-end justify-self-center">
            <div class="text-xs text-muted">
              {isMac ? '⌘' : 'Ctrl'} + Enter or Shift + Enter to send
            </div>
          </div>
        </div>
      </div>

      <ScrollPanel>
        <Show when={props.sessionId} fallback={<BlankSession />}>
          <div class="flex flex-col items-center justify-center">
            <Show when={session.chats}>
              {(c) => (
                <For each={c()}>
                  {(chatId) => {
                    const chat = selectChatById(chatId)();

                    if (!chat) return null;
                    return (
                      <ChatPanel
                        chat={chat}
                        sessionId={session.id}
                        attachments={session.attachments}
                        variant="note"
                      />
                    );
                  }}
                </For>
              )}
            </Show>
          </div>
        </Show>
      </ScrollPanel>
    </div>
  );
}

const BlankSession: Component = (props: { attachments?: File[] }) => {
  return (
    <div class="grid h-full flex-1 justify-center">
      <div class="col-span-full row-span-full">
        <For each={store.draftChats}>
          {(chat) => (
            <ChatPanel
              chat={chat}
              sessionId={store.draftSession.id}
              attachments={props.attachments}
              variant="note"
            />
          )}
        </For>
      </div>
      <div class="col-span-full row-span-full flex h-full items-center justify-center gap-4 px-6">
        <SpeedDial items={store.speedDial} />
      </div>
    </div>
  );
};
