import './index.css';

import { Route, Router } from '@solidjs/router';
import { ErrorBoundary, lazy } from 'solid-js';
/* @refresh reload */
import { render } from 'solid-js/web';

// routes
import { AppLayout } from './app-layout';
import { AppError } from './components/connected/app-error';
import { Session } from './routes/session';

const Sandbox = lazy(() => import('./routes/sandbox/sandbox'));
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
        <Router root={AppLayout}>
          <Route path="/session/:id" component={Session} />
          <Route path="/debug" component={Debug} />
          <Route path="/settings" component={Settings} />
          <Route path="/models" component={ModelList} />
          <Route path="/presets" component={Presets} />
          <Route path="/assistants" component={Assistants} />
          <Route path="/sandbox" component={Sandbox} />
          <Route path="/" component={Session} />
        </Router>
      </ErrorBoundary>
    ),
    root,
  );
} else {
  console.error('Root element not found');
}
