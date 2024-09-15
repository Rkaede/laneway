import { useNavigate, useParams } from '@solidjs/router';
import { For, type ParentComponent, Show } from 'solid-js';

import { ChatCard } from '~/components/chat/chat-card';
import { ChatInput } from '~/components/chat/chat-input';
import { ChatPanel } from '~/components/chat/chat-panel';
import { Shortcut } from '~/components/ui/shortcut';
import { useActionContext } from '~/hooks/use-action-context';
import { setStore, store } from '~/store';
import {
  actions,
  addMessageToSessionChats,
  autonameChat,
  setAssistant,
  setSessionInput,
} from '~/store/actions';

export function Session() {
  const navigate = useNavigate();
  const params = useParams();
  const session = () => store.sessions.find((s) => s.id === params.id);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    const _value = session()?.input ?? store.draftSession.input;

    if (_value === '' || _value === undefined) return;
    setSessionInput('', params.id);
    const message = { role: 'user', content: _value } as const;
    const id = addMessageToSessionChats(message, params.id);

    if (!params.id) {
      navigate(`/session/${id}`);
      if (store.settings.generateTitles) {
        autonameChat(id, _value);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  function handleInput(e: InputEvent) {
    setSessionInput((e.currentTarget as HTMLInputElement).value, params.id);
  }

  return (
    <div class="relative flex h-full w-full flex-col">
      {/* this column reverse container is needed to keep the scrollbar at the bottom */}
      <div class="flex h-full w-full flex-col-reverse overflow-auto">
        <Show when={session()} fallback={<BlankSession />}>
          {(s) => (
            <ChatPanelLayout numChats={s().chats.length}>
              <For each={s().chats}>
                {(chatId) => {
                  const chat = store.chats.find((c) => c.id === chatId);
                  if (!chat) return null;
                  return (
                    <ChatPanel
                      chat={chat}
                      sessionId={s().id}
                      onChangeAssistant={(id) => setAssistant(id, chat.id)}
                    />
                  );
                }}
              </For>
            </ChatPanelLayout>
          )}
        </Show>
      </div>
      <div class="relative mx-auto flex max-h-60 min-h-16 w-full max-w-[1000px] flex-col gap-1">
        <div class="relativeflex min-h-16 w-full max-w-[1000px] flex-col overflow-hidden rounded-t-xl border border-background-4 bg-background-2 px-6 pl-0">
          <ChatInput
            value={session()?.input ?? store.draftSession.input ?? ''}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </div>
  );
}

function BlankSession() {
  function handleAssistantChange(id: string, chatId: string) {
    setStore('draftChats', (c) => c.id === chatId, 'assistantId', id);
  }

  const context = useActionContext();

  return (
    <ChatPanelLayout numChats={store.draftChats.length}>
      <For each={store.draftChats}>
        {(chat) => (
          <ChatPanel
            chat={chat}
            sessionId={store.draftSession.id}
            onChangeAssistant={(id) => handleAssistantChange(id, chat.id)}
          />
        )}
      </For>
      <div style={{ 'grid-column': '1 / -1' }} class="flex flex-col gap-4">
        <div class="flex flex-col gap-20 self-center">
          <div class="flex flex-col gap-2 self-center">
            <div class="flex gap-4">
              <ChatCard
                title="Full House"
                tags={['Preset']}
                subtitle="Compare frontier models"
                onClick={() => {
                  actions.newSession.fn(context, {
                    template: { type: 'preset', id: 'full-house' },
                  });
                }}
              />
              <ChatCard
                title="Claude 3.5 Sonnet"
                tags={['Model']}
                subtitle="Best of the vibecheck"
                onClick={() => {
                  actions.newSession.fn(context, {
                    template: { type: 'model', id: 'anthropic/claude-3.5-sonnet' },
                  });
                }}
              />
            </div>
            <div class="self-center text-xs text-muted-foreground">
              <Shortcut variant="solid">$mod+K</Shortcut> for more options.
            </div>
          </div>
        </div>
      </div>
    </ChatPanelLayout>
  );
}

const ChatPanelLayout: ParentComponent<{ numChats: number }> = (props) => {
  return (
    <div
      class="grid flex-1 justify-center px-4"
      style={{
        'grid-template-columns': `repeat(${props.numChats}, minmax(0, 70ch))`,
      }}
    >
      {props.children}
    </div>
  );
};
