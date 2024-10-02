import { useParams } from '@solidjs/router';
import { Show } from 'solid-js';

import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { store } from '~/store';

export function Session() {
  const params = useParams();

  const activeSession = () =>
    store.sessions.find((s) => s.id === params.id) ?? store.draftSession;

  return (
    <Show when={activeSession()}>
      <Show
        when={activeSession()?.type === 'note'}
        fallback={<MultiChatLayout sessionId={params.id} />}
      >
        <NoteLayout sessionId={params.id} />
      </Show>
    </Show>
  );
}
