import type { Component } from 'solid-js';

import { Button } from '~/components/ui/button';
import { deleteData, store } from '~/store';
import { download } from '~/util';

export const AppError: Component = () => {
  const handleClearData = () => {
    deleteData();
    window.location.reload();
  };

  const handleExportData = () => {
    download(JSON.stringify(store), 'chat-data.json');
  };

  return (
    <div class="mx-auto flex h-screen w-full max-w-lg flex-col items-center justify-center text-center text-foreground">
      <h1 class="mb-4 text-3xl font-bold">Uh oh! Something went wrong</h1>
      <p class="mb-6 text-lg">
        It's likely we've updated the app, but your existing chat data is in an older format.
        Unfortunately, we don't support automatic migrations yet.
      </p>
      <p class="mb-6 text-lg">
        Please clear the data and reload the page. You may want to export your data before you
        do this. If the problem persists, please create a GitHub issue.
      </p>
      <p class="mb-4 text-sm text-muted-foreground">
        Note: Clearing the chat data will not clear the locally stored API keys.
      </p>
      <div class="flex gap-4">
        <Button variant="default" onClick={handleExportData}>
          Export Data
        </Button>
        <Button variant="destructive" onClick={handleClearData}>
          Clear Data & Reload
        </Button>
      </div>
    </div>
  );
};
