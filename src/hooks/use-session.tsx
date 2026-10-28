import { useNavigate } from '@solidjs/router';
import { Accessor, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';

import { store } from '~/store';
import { setSessionInput } from '~/store/actions';
import { addMessageToSessionChats, autonameChat } from '~/store/actions';
import { selectSessionById } from '~/store/selectors';

import { createMessage } from './message-utils';

type SessionStore = {
  attachments: File[];
  draft: boolean;
  chatIds: string[];
};

export function createSession(sessionId?: Accessor<string | undefined>) {
  const navigate = useNavigate();
  const selectedSession = selectSessionById(() => sessionId?.());
  const session = () => selectedSession() ?? store.draftSession;

  const [sessionStore, setSessionStore] = createStore<SessionStore>({
    attachments: [],
    draft: !sessionId?.(),
    chatIds: session().chats,
  });
  let isSubmitting = false;

  function handleInput(value: string) {
    setSessionInput(value, sessionId?.());
  }

  function handleFileSelect(file: File) {
    setSessionStore('attachments', (prev) => [...prev, file]);
  }

  function handleRemoveFile(file: File) {
    setSessionStore('attachments', (prev) => prev?.filter((f) => f !== file));
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (
      session().type === 'note' &&
      store.chats.some((chat) => session().chats.includes(chat.id) && chat.status === 'loading')
    ) {
      return;
    }
    isSubmitting = true;

    try {
      const _input = session().input;
      if (_input === '' || _input === undefined) return;

      const message = await createMessage(_input, sessionStore.attachments, {
        chatIds: sessionStore.chatIds,
        draft: sessionStore.draft,
      });

      if (!message) return;

      if (session().type !== 'note') {
        setSessionInput('', sessionId?.());
      }

      const id = addMessageToSessionChats(message, sessionId?.(), session().type);

      if (!sessionId?.()) {
        navigate(`/session/${id}`);
        if (store.settings.generateTitles) {
          autonameChat(id, _input);
        }
      }

      setSessionStore('attachments', []);
    } finally {
      isSubmitting = false;
    }
  }

  const hook = mergeProps(session, sessionStore, {
    handleInput,
    handleFileSelect,
    handleRemoveFile,
    handleSubmit,
  });
  return hook;
}
