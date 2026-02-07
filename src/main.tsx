import './index.css';

import { Route, Router } from '@solidjs/router';
import { ErrorBoundary, lazy } from 'solid-js';
/* @refresh reload */
import { render } from 'solid-js/web';

// routes
import { AppLayout } from './app-layout';
import { AppError } from './components/connected/app-error';
import { Session } from './routes/session';

const SandboxLayout = lazy(() => import('./routes/sandbox/sandbox-layout'));
const StoryPage = lazy(() => import('./routes/sandbox/story-page'));
const Debug = lazy(() => import('./routes/debug'));
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
            <Route path="/debug" component={Debug} />
            <Route path="/settings" component={Settings} />
            <Route path="/models" component={ModelList} />
            <Route path="/presets" component={Presets} />
            <Route path="/assistants" component={Assistants} />
            <Route path="/" component={Session} />
          </Route>

          {/* Sandbox routes with SandboxLayout */}
          <Route path="/sandbox" component={SandboxLayout}>
            <Route path="/:story" component={StoryPage} />
            <Route
              path="/"
              component={() => (
                <div class="flex h-full items-center justify-center text-muted-foreground">
                  Select a story from the sidebar
                </div>
              )}
            />
          </Route>
        </Router>
      </ErrorBoundary>
    ),
    root,
  );
} else {
  console.error('Root element not found');
}
