import './index.css';

import { Route, Router } from '@solidjs/router';
import { ErrorBoundary, lazy } from 'solid-js';
/* @refresh reload */
import { render } from 'solid-js/web';

// routes
import { AppLayout } from './app-layout';
import { AppError } from './components/connected/app-error';
import { NotFound } from './routes/not-found';
import { Session } from './routes/session';

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

const root = document.getElementById('root');

if (root) {
  render(
    () => (
      <ErrorBoundary fallback={<AppError />}>
        <Router>
          {/* Main app routes with AppLayout */}
          <Route path="/" component={AppLayout}>
            <Route path="/session/:id" component={Session} />
            {import.meta.env.DEV && <Route path="/debug" component={Debug} />}
            <Route path="/settings" component={Settings} />
            <Route path="/models" component={ModelList} />
            <Route path="/presets" component={Presets} />
            <Route path="/assistants" component={Assistants} />
            <Route path="/" component={Session} />
            <Route path="*" component={NotFound} />
          </Route>

          {/* Sandbox routes with SandboxLayout */}
          {import.meta.env.DEV && (
            <Route path="/sandbox" component={SandboxLayout}>
              <Route path="/:story" component={StoryPage} />
              <Route
                path="/"
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
