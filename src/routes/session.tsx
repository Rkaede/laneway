import { Navigate, useParams, useSearchParams } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';

import { SessionProvider } from '~/components/connected/session-provider';
import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { store } from '~/store';
import { newDraftSession } from '~/store/actions';
import { anyKeysSet, selectRouteSession } from '~/store/selectors';

import { NotFound } from './not-found';
import { parseSessionType } from './session-query';

export function Session() {
  const params = useParams();

  const [searchParams] = useSearchParams();

  // Handle draft session creation from query params
  createEffect(() => {
    const modelId =
      typeof searchParams.model === 'string' ? searchParams.model : searchParams.model?.[0];
    const type = parseSessionType(searchParams.type);

    // Only update draft session if we're on the root route and have a model param
    if (!params.id && modelId) {
      newDraftSession({
        sessionType: type,
        referenceId: modelId,
        type: 'model',
      });
    }
  });

  const activeSession = selectRouteSession(() => params.id);

  // New visitors without a key see the welcome page once. After that the root route is always a
  // chat, and sending without a key asks for one.
  const showWelcome = () => !params.id && !store.settings.hasSeenWelcome && !anyKeysSet();

  return (
    <Show when={!showWelcome()} fallback={<Navigate href="/welcome" />}>
      <Show when={activeSession()} keyed fallback={<NotFound session />}>
        {(session) => (
          <SessionProvider sessionId={params.id} session={session}>
            <Show
              when={session.type === 'note'}
              fallback={<MultiChatLayout sessionId={params.id} />}
            >
              <NoteLayout sessionId={params.id} />
            </Show>
          </SessionProvider>
        )}
      </Show>
    </Show>
  );
}
