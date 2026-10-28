import './index.css';

import { Route, Router, type RouteSectionProps, useCurrentMatches } from '@solidjs/router';
import { createEffect, ErrorBoundary, lazy } from 'solid-js';
/* @refresh reload */
import { render } from 'solid-js/web';

// routes
import { AppLayout } from './app-layout';
import { AppError } from './components/connected/app-error';
import { getDocumentTitle } from './document-title';
import { registerPreloadErrorHandler } from './preload-error';
import { NotFound } from './routes/not-found';
import { Session } from './routes/session';
import { selectRouteSession } from './store/selectors';

registerPreloadErrorHandler(window, import.meta.url);

const SandboxLayout = import.meta.env.DEV
  ? lazy(() => import('./routes/sandbox/sandbox-layout'))
  : undefined;
const StoryPage = import.meta.env.DEV
  ? lazy(() => import('./routes/sandbox/story-page'))
  : undefined;
const Debug = import.meta.env.DEV ? lazy(() => import('./routes/debug')) : undefined;
const Settings = lazy(() => import('./routes/settings/settings'));
const Assistants = lazy(() => import('./routes/assistants'));
const Presets = lazy(() => import('./routes/presets'));
const ModelList = lazy(() => import('./routes/models'));

function AppRoot(props: RouteSectionProps) {
  const matches = useCurrentMatches();
  const session = selectRouteSession(() => props.params.id);

  createEffect(() => {
    document.title = getDocumentTitle(matches().at(-1)?.route.info, session());
  });

  return props.children;
}

const root = document.getElementById('root');

if (root) {
  render(
    () => (
      <ErrorBoundary fallback={<AppError />}>
        <Router root={AppRoot}>
          {/* Main app routes with AppLayout */}
          <Route path="/" component={AppLayout}>
            <Route path="/session/:id" component={Session} info={{ session: true }} />
            {import.meta.env.DEV && (
              <Route path="/debug" component={Debug} info={{ title: 'Debug' }} />
            )}
            <Route path="/settings" component={Settings} info={{ title: 'Settings' }} />
            <Route path="/models" component={ModelList} info={{ title: 'Models' }} />
            <Route path="/presets" component={Presets} info={{ title: 'Presets' }} />
            <Route path="/assistants" component={Assistants} info={{ title: 'Assistants' }} />
            <Route path="/" component={Session} info={{ session: true }} />
            <Route path="*" component={NotFound} info={{ title: 'Page not found' }} />
          </Route>

          {/* Sandbox routes with SandboxLayout */}
          {import.meta.env.DEV && (
            <Route path="/sandbox" component={SandboxLayout}>
              <Route path="/:story" component={StoryPage} info={{ title: 'UI Sandbox' }} />
              <Route
                path="/"
                info={{ title: 'UI Sandbox' }}
                component={() => (
                  <div class="flex h-full items-center justify-center text-muted">
                    Select a story from the sidebar
                  </div>
                )}
              />
            </Route>
          )}
        </Router>
      </ErrorBoundary>
    ),
    root,
  );
} else {
  console.error('Root element not found');
}
