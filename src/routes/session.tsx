import { useParams, useSearchParams } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';

import { SessionProvider } from '~/components/connected/session-context';
import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { store } from '~/store';
import { newDraftSession } from '~/store/actions';

export function Session() {
  const params = useParams();

  const [searchParams] = useSearchParams();

  // Handle draft session creation from query params
  createEffect(() => {
    const modelId = typeof searchParams.model === 'string' ? searchParams.model : searchParams.model?.[0];
    const type = searchParams.type as 'chat' | 'note';
    
    // Only update draft session if we're on the root route and have a model param
    if (!params.id && modelId) {
      newDraftSession({
        sessionType: type || 'chat',
        referenceId: modelId,
        type: 'model'
      });
    }
  });

  const activeSession = () =>
    store.sessions.find((s) => s.id === params.id) ?? store.draftSession;

  return (
    <Show when={activeSession()}>
      <SessionProvider sessionId={params.id}>
        <Show
          when={activeSession()?.type === 'note'}
          fallback={<MultiChatLayout sessionId={params.id} />}
        >
          <NoteLayout sessionId={params.id} />
        </Show>
      </SessionProvider>
    </Show>
  );
}
