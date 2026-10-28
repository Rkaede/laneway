import { useParams, useSearchParams } from '@solidjs/router';
import { createEffect, Show } from 'solid-js';

import { SessionProvider } from '~/components/connected/session-provider';
import { WelcomeContent } from '~/components/connected/welcome';
import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { newDraftSession } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { selectRouteSession } from '~/store/selectors';
import { anyKeysSet } from '~/store/selectors';

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

  return (
    <Show when={activeSession()} keyed fallback={<NotFound session />}>
      {(session) => (
        <Show
          when={(anyKeysSet() && apiKeys.hasCompletedWelcome) || session.created === -1}
          fallback={<WelcomeContent />}
        >
          <SessionProvider sessionId={params.id} session={session}>
            <Show
              when={session.type === 'note'}
              fallback={<MultiChatLayout sessionId={params.id} />}
            >
              <NoteLayout sessionId={params.id} />
            </Show>
          </SessionProvider>
        </Show>
      )}
    </Show>
  );
}
