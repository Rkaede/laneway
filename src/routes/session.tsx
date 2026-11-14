import { Navigate, useParams, useSearchParams } from '@solidjs/router';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';

import { SessionProvider } from '~/components/connected/session-provider';
import { MultiChatLayout } from '~/components/layouts/multichat-layout';
import { NoteLayout } from '~/components/layouts/note-layout';
import { Loader } from '~/components/ui/loader';
import { useScrollToMessage } from '~/hooks/use-scroll-to-message';
import { useSessionMessages } from '~/hooks/use-session-messages';
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
  const messages = useSessionMessages(activeSession);
  useScrollToMessage(() => Boolean(params.id && activeSession() && messages.ready()));

  // New visitors without a key see the welcome page once. After that the root route is always a
  // chat, and sending without a key asks for one.
  const showWelcome = () => !params.id && !store.settings.hasSeenWelcome && !anyKeysSet();

  return (
    <Show when={!showWelcome()} fallback={<Navigate href="/welcome" />}>
      <Show when={activeSession()} keyed fallback={<NotFound session />}>
        {(session) => (
          <SessionProvider session={session}>
            <Show
              when={messages.ready()}
              fallback={<SessionLoading error={messages.error()} />}
            >
              <Show
                when={session.type === 'note'}
                fallback={<MultiChatLayout sessionId={params.id} />}
              >
                <NoteLayout sessionId={params.id} />
              </Show>
            </Show>
          </SessionProvider>
        )}
      </Show>
    </Show>
  );
}

/** Shown while a session's messages load from the database, which usually takes a few ms. */
function SessionLoading(props: { error?: Error }) {
  // Wait before showing the loader, so a quick load does not flash it.
  const [visible, setVisible] = createSignal(false);
  const timer = setTimeout(() => setVisible(true), 300);
  onCleanup(() => clearTimeout(timer));

  return (
    <div
      class="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
      aria-busy={!props.error}
    >
      <Show
        when={props.error}
        fallback={
          <Show when={visible()}>
            <Loader />
          </Show>
        }
      >
        <h1 class="text-xl font-medium">Unable to load this chat</h1>
        <p class="text-muted">Its messages could not be read from this browser's storage.</p>
      </Show>
    </div>
  );
}
