import type { Component } from 'solid-js';

import { Button } from '~/components/ui/button';

export const AppErrorView: Component<{
  onReload: () => void;
  onExport: () => void;
  onClear: () => void;
}> = (props) => {
  return (
    <div class="mx-auto flex h-screen w-full max-w-lg flex-col items-center justify-center text-center text-main">
      <h1 class="mb-4 text-3xl font-bold">Uh oh! Something went wrong</h1>
      <p class="mb-6 text-lg">
        Laneway encountered an unexpected error. Try reloading the page to recover without
        deleting your data.
      </p>
      <p class="mb-6 text-lg">
        If the problem persists, export your data for a backup and create a GitHub issue.
        Clearing data is a last resort and cannot be undone.
      </p>
      <p class="mb-4 text-sm text-muted">
        Note: Clearing the chat data will not clear the locally stored API keys.
      </p>
      <div class="flex gap-4">
        <Button variant="default" onClick={props.onReload}>
          Reload
        </Button>
        <Button variant="outline" onClick={props.onExport}>
          Export Data
        </Button>
        <Button variant="destructive" onClick={props.onClear}>
          Clear Data & Reload
        </Button>
      </div>
    </div>
  );
};
