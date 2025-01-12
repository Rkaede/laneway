import { Component, For, lazy, Show } from 'solid-js';

import { ChatPanel } from '~/components/chat/chat-panel';
import { SpeedDial } from '~/components/connected/speed-dial';
import { IconSendHorizontal } from '~/components/icons/ui';
import { Button, ScrollPanel } from '~/components/ui';
import { createSession } from '~/hooks/use-session';
import { store } from '~/store';
import { setSessionInput } from '~/store/actions';
const TextEditor = lazy(() => import('../ui/text-editor/text-editor'));

export function NoteLayout(props: { sessionId: string }) {
  const session = createSession(() => props.sessionId);

  return (
    <div class="grid size-full min-h-0 grid-cols-2">
      <div class="">
        <div class="grid h-full bg-background-2 p-3">
          <TextEditor
            onInput={(value) => setSessionInput(value, props.sessionId)}
            initialValue={session.input}
            onSubmit={() => session.handleSubmit()}
            class="col-start-1 row-start-1"
            placeholder="Use Shift + Enter to submit"
            mode="note"
          />
          {session.input === '' && (
            <div class="col-start-1 row-start-1 ml-2 mt-[-1px] gap-0.5">
              <div class="font-light italic text-muted-foreground">
                write and refine a single prompt
              </div>
            </div>
          )}
          <div class="z-10 col-start-1 row-start-1 mb-0 mr-0.5 mt-1 gap-0.5 place-self-end">
            <Button
              variant="ghost"
              aria-label="Submit Note"
              size="default"
              onClick={() => session.handleSubmit()}
            >
              <IconSendHorizontal class="h-4 w-4" />
            </Button>
          </div>
          <div class="z-10 col-start-1 row-start-1 mb-0 mr-0.5 mt-1 flex flex-col items-end gap-0.5 place-self-end justify-self-center">
            <div class="text-xs text-muted-foreground">shift + enter to send</div>
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
                    const chat = store.chats.find((c) => c.id === chatId);

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
