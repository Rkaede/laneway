import { useParams, useSearchParams } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';

import { SessionProvider } from '~/components/connected/session-provider';
import { WelcomeContent } from '~/components/connected/welcome';
import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { store } from '~/store';
import { newDraftSession } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { anyKeysSet } from '~/store/selectors';

export function Session() {
  const params = useParams();

  const [searchParams] = useSearchParams();

  // Handle draft session creation from query params
  createEffect(() => {
    const modelId =
      typeof searchParams.model === 'string' ? searchParams.model : searchParams.model?.[0];
    const type = searchParams.type as 'chat' | 'note';

    // Only update draft session if we're on the root route and have a model param
    if (!params.id && modelId) {
      newDraftSession({
        sessionType: type || 'chat',
        referenceId: modelId,
        type: 'model',
      });
    }
  });

  const activeSession = () =>
    store.sessions.find((s) => s.id === params.id) ?? store.draftSession;

  return (
    <Show
      when={(anyKeysSet() && apiKeys.hasCompletedWelcome) || activeSession().created === -1}
      fallback={
        <WelcomeContent
          openRouterKey={() => ''}
          openAIKey={() => ''}
          googleKey={() => ''}
          setOpenRouterKey={() => {}}
          setOpenAIKey={() => {}}
          setGoogleKey={() => {}}
        />
      }
    >
      <Show when={activeSession()}>
        <SessionProvider sessionId={params.id} session={activeSession()}>
          <Show
            when={activeSession()?.type === 'note'}
            fallback={<MultiChatLayout sessionId={params.id} />}
          >
            <NoteLayout sessionId={params.id} />
          </Show>
        </SessionProvider>
      </Show>
    </Show>
  );
}
