import { Component, For, Show } from 'solid-js';

import { ChatPanel } from '~/components/chat/chat-panel';
import { SpeedDial } from '~/components/connected/speed-dial';
import { IconReply } from '~/components/icons/ui';
import { Button, TextEditor } from '~/components/ui';
import { createSession } from '~/hooks/use-session';
import { store } from '~/store';
import { setSessionInput } from '~/store/actions';

export function NoteLayout(props: { sessionId: string }) {
  const session = createSession(() => props.sessionId);

  return (
    <div class="grid size-full grid-cols-2">
      <div class="">
        <div class="grid h-full border bg-background-main p-2">
          <TextEditor
            onInput={(value) => setSessionInput(value, props.sessionId)}
            initialValue={session.input}
            onSubmit={() => session.handleSubmit()}
            class="col-start-1 row-start-1"
            placeholder="Use Shift + Enter to submit"
            mode="note"
          />
          <div class="z-10 col-start-1 row-start-1 mb-0.5 mr-0.5 mt-1 place-self-end">
            <Button
              variant="ghost"
              aria-label="Submit Note"
              onClick={() => session.handleSubmit()}
            >
              <IconReply class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div class="flex size-full flex-col-reverse place-content-center items-center justify-center overflow-auto">
        <Show when={props.sessionId} fallback={<BlankSession />}>
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
        </Show>
      </div>
    </div>
  );
}

const BlankSession: Component = (props: { attachments?: File[] }) => {
  return (
    <div class="grid flex-1">
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
      <div class="col-span-full row-span-full flex items-center justify-center gap-4 px-6">
        <SpeedDial items={store.speedDial} />
      </div>
    </div>
  );
};
