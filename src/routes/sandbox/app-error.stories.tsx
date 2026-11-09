import { createSignal } from 'solid-js';

import { AppErrorView } from '~/components/connected/app-error-view';

import { CellHeader } from './story-components';

export function Default() {
  const [lastAction, setLastAction] = createSignal('none');

  return (
    <>
      <CellHeader>Last button pressed: {lastAction()}</CellHeader>
      <AppErrorView
        onReload={() => setLastAction('Reload')}
        onExport={() => setLastAction('Export Data')}
        onClear={() => setLastAction('Clear Data')}
      />
    </>
  );
}
