import './index.css';

import { Route, Router } from '@solidjs/router';
import { ErrorBoundary } from 'solid-js';
/* @refresh reload */
import { render } from 'solid-js/web';

// routes
import { AppLayout } from './app-layout';
import { AppError } from './components/connected/app-error';
import { Assistants } from './routes/assistants';
import { Debug } from './routes/debug';
import { ModelList } from './routes/models';
import { Presets } from './routes/presets';
import { Sandbox } from './routes/sandbox';
import { Session } from './routes/session';
import { Settings } from './routes/settings';

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
